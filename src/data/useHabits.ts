import {useEffect,useRef,useState} from 'react';
import {onAuthStateChanged,type User} from 'firebase/auth';
import {collection,doc,getDocs,limit,onSnapshot,orderBy,query,setDoc,startAfter,where,writeBatch,type DocumentData,type QueryDocumentSnapshot} from 'firebase/firestore';
import {auth,db} from './firebase';
import {addDays,emptyData,entryId,localDate,type Data,type Entry,type Habit,type Settings} from '../domain/model';

const LOCAL_KEY='habit-grid.local.v1';
const MODE_KEY='habit-grid.local-mode';
export type SyncState='loading'|'local'|'synced'|'pending'|'offline'|'error';
export function useHabits() {
  const [user,setUser]=useState<User|null>(null);
  const [authReady,setAuthReady]=useState(!auth);
  const [localMode,setLocalMode]=useState(()=>localStorage.getItem(MODE_KEY)==='true');
  const [data,setData]=useState<Data>(emptyData);
  const dataRef=useRef(data); dataRef.current=data;
  const [sync,setSync]=useState<SyncState>('loading');
  const [error,setError]=useState('');
  const [online,setOnline]=useState(navigator.onLine);
  const dataset=useRef('primary');
  const retries=useRef<Array<()=>Promise<unknown>>>([]);
  const cloud=!!user&&!!db;
  useEffect(()=>{
    const update=()=>setOnline(navigator.onLine);
    window.addEventListener('online',update);window.addEventListener('offline',update);
    const stop=auth?onAuthStateChanged(auth,u=>{setUser(u);setAuthReady(true);setData(emptyData());}):()=>{};
    return()=>{stop();window.removeEventListener('online',update);window.removeEventListener('offline',update);};
  },[]);
  useEffect(()=>{
    if(!authReady)return;
    setError('');retries.current=[];
    if(!cloud) {
      try {const raw=localMode?localStorage.getItem(LOCAL_KEY):null;setData(raw?JSON.parse(raw):emptyData());setSync('local');}catch{setError('Could not read saved data on this device. Export a backup before clearing browser storage.');setSync('error');}
      return;
    }
    const uid=user!.uid;
    let unsubscribers:Array<()=>void>=[];let live=true;let active='';
    setSync('loading');
    const fail=(e:Error)=>{if(live){setError(`Could not sync your habits. ${e.message}`);setSync('error');}};
    const stopProfile=onSnapshot(doc(db!,'users',uid),{includeMetadataChanges:true},profile=>{
      if(!live)return;
      const profileData=profile.data();
      const settings=profileData?(({dataset:_,...rest})=>rest)(profileData) as Settings:emptyData().settings;
      setData(old=>({...old,settings}));
      const nextDataset=profileData?.dataset||'primary';
      if(nextDataset===active)return;
      active=nextDataset;dataset.current=active;unsubscribers.forEach(stop=>stop());
      setData(old=>({...old,habits:[],entries:{}}));
      const base=['users',uid,'datasets',active] as const;
      const boundary=addDays(localDate(settings.timezone),-90);
      let habitsReady=false,entriesReady=false;
      const ready=()=>{if(habitsReady&&entriesReady)setSync('synced');};
      unsubscribers=[
        onSnapshot(collection(db!,...base,'habits'),{includeMetadataChanges:true},snapshot=>{
          setData(old=>({...old,habits:snapshot.docs.map(d=>d.data() as Habit).sort((a,b)=>a.order-b.order)}));
          habitsReady=true;ready();if(snapshot.metadata.hasPendingWrites)setSync('pending');
        },fail),
        onSnapshot(query(collection(db!,...base,'entries'),where('date','>=',boundary)),{includeMetadataChanges:true},snapshot=>{
          setData(old=>{const entries={...old.entries};for(const d of snapshot.docs)entries[d.id]=d.data() as Entry;return {...old,entries};});
          entriesReady=true;ready();if(snapshot.metadata.hasPendingWrites)setSync('pending');
        },fail),
      ];
      // Older history is read once, in bounded pages. Live changes focus on the recent 90 days.
      void (async()=>{let cursor:QueryDocumentSnapshot<DocumentData>|undefined;const expected=active;
        do {const constraints=[where('date','<',boundary),orderBy('date'),limit(250),...(cursor?[startAfter(cursor)]:[])];
          const page=await getDocs(query(collection(db!,...base,'entries'),...constraints));
          if(!live||active!==expected)return;
          setData(old=>{const entries={...old.entries};for(const d of page.docs)entries[d.id]=d.data() as Entry;return {...old,entries};});
          cursor=page.size===250?page.docs[page.docs.length-1]:undefined;
        }while(cursor);
      })().catch(fail);
    },fail);
    return()=>{live=false;stopProfile();unsubscribers.forEach(stop=>stop());};
  },[authReady,cloud,user,localMode]);

  function persistLocal(next:Data) {
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify(next));dataRef.current=next;setData(next);setSync('local');setError('');}
    catch{setError('This device could not save your change. Free browser storage and try again.');setSync('error');throw new Error('Device storage is full or unavailable.');}
  }
  function send(operation:()=>Promise<unknown>) {
    setSync('pending');setError('');
    void operation().then(()=>{if(!retries.current.length){setSync('synced');setError('');}}).catch((e:Error)=>{retries.current.push(operation);setSync('error');setError(`Your change has not synced. ${e.message}`);});
  }
  function saveEntry(entry:Entry) {
    const id=entryId(entry.habitId,entry.date);
    const next={...dataRef.current,entries:{...dataRef.current.entries,[id]:entry}};
    if(!cloud){persistLocal(next);return;}
    dataRef.current=next;setData(next);send(()=>setDoc(doc(db!,'users',user!.uid,'datasets',dataset.current,'entries',id),entry));
  }
  function saveHabits(habits:Habit[]) {
    if(!cloud){persistLocal({...dataRef.current,habits});return;}
    const changed=habits.filter(h=>JSON.stringify(h)!==JSON.stringify(dataRef.current.habits.find(old=>old.id===h.id)));
    dataRef.current={...dataRef.current,habits};setData(dataRef.current);
    send(()=>{const batch=writeBatch(db!);for(const habit of changed)batch.set(doc(db!,'users',user!.uid,'datasets',dataset.current,'habits',habit.id),habit);return batch.commit();});
  }
  function saveSettings(settings:Settings) {
    if(!cloud){persistLocal({...dataRef.current,settings});return;}
    dataRef.current={...dataRef.current,settings};setData(dataRef.current);send(()=>setDoc(doc(db!,'users',user!.uid),{...settings,dataset:dataset.current}));
  }
  async function replaceData(next:Data) {
    if(!cloud){persistLocal(next);return;}
    if(!online)throw new Error('Connect to the internet before replacing cloud data.');
    const nextDataset=crypto.randomUUID();
    const records=[...next.habits.map(h=>({path:'habits',id:h.id,value:h})),...Object.entries(next.entries).map(([id,e])=>({path:'entries',id,value:e}))];
    for(let start=0;start<records.length;start+=400){const batch=writeBatch(db!);for(const record of records.slice(start,start+400))batch.set(doc(db!,'users',user!.uid,'datasets',nextDataset,record.path,record.id),record.value);await batch.commit();}
    await setDoc(doc(db!,'users',user!.uid),{...next.settings,dataset:nextDataset});
  }
  function retry(){const pending=retries.current.splice(0);if(!pending.length){location.reload();return;}pending.forEach(send);}
  function startLocal(){localStorage.setItem(MODE_KEY,'true');setLocalMode(true);}
  return {data,user,authReady,localMode,startLocal,saveEntry,saveHabits,saveSettings,replaceData,retry,error,setError,sync:!online&&sync!=='error'?'offline':sync,online,cloud};
}
