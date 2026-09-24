import {describe,it,expect} from 'vitest';
import {parseBackup,exportBackup} from '../src/domain/backup';
import {emptyData,starterHabits} from '../src/domain/model';
function fixture(){return {...emptyData('America/Toronto'),habits:starterHabits('2026-01-01')};}
describe('backup validation',()=>{
 it('round-trips a complete versioned backup',()=>{const data=fixture();expect(parseBackup(exportBackup(data))).toEqual(data);});
 it('rejects unknown versions and invalid JSON',()=>{expect(()=>parseBackup('{')).toThrow();expect(()=>parseBackup(JSON.stringify({...fixture(),version:2}))).toThrow();});
 it('rejects duplicate IDs before importing',()=>{const data=fixture();data.habits.push(data.habits[0]);expect(()=>parseBackup(exportBackup(data))).toThrow('unique');});
 it('rejects corrupt rules and schedules',()=>{const data=fixture();data.habits[0].rules[0].days=[8];expect(()=>parseBackup(exportBackup(data))).toThrow('schedule');});
 it('rejects invalid calendar dates',()=>{const data=fixture();data.habits[0].createdOn='2026-02-30';expect(()=>parseBackup(exportBackup(data))).toThrow();});
 it('rejects orphan entries',()=>{const data=fixture();data.entries={missing_2026:{habitId:'missing',date:'2026-01-01',status:'met',value:null,updatedAt:new Date().toISOString()}};expect(()=>parseBackup(exportBackup(data))).toThrow();});
 it('rejects malformed timezones',()=>{const data=fixture();data.settings.timezone='Mars/Olympus';expect(()=>parseBackup(exportBackup(data))).toThrow('timezone');});
 it('rejects unknown fields to avoid silently corrupting newer formats',()=>expect(()=>parseBackup(JSON.stringify({...fixture(),unknown:true}))).toThrow());
});
