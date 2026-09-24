/** Firebase's auth helper must share the app's origin on its Hosting domains. */
export function authDomainForHost(
  projectId: string | undefined,
  configuredDomain: string | undefined,
  hostname: string,
) {
  const hostingDomains = [
    `${projectId}.web.app`,
    `${projectId}.firebaseapp.com`,
  ];
  return projectId && hostingDomains.includes(hostname)
    ? hostname
    : configuredDomain;
}
