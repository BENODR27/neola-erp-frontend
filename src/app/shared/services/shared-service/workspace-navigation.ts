export interface NavbarItem {
  label: string;
  link: string;
  icon?: string;
  permission?: string;
}
export interface WorkspaceNavigation {
  applicationName: string;
  landingRoute: string | null;
  navbarItems: NavbarItem[];
}
export interface WorkspaceCatalog {
  navigation: WorkspaceNavigation[];
}

export function normalizeWorkspaceRoute(route: string): string {
  return (
    route
      .split(/[?#]/, 1)[0]
      .replace(/^\/admin(?=\/|$)/, '/adminv2')
      .replace(/\/+$/, '') || '/'
  );
}

/** Resolve routes using the permitted IAM catalog; no frontend application menu catalog. */
export function navigationForUrl(catalog: WorkspaceNavigation[], url: string): NavbarItem[] {
  const route = normalizeWorkspaceRoute(url);
  let best: WorkspaceNavigation | undefined;
  let score = 0;
  for (const workspace of catalog) {
    if (!workspace.landingRoute) continue;
    for (const link of [
      workspace.landingRoute,
      ...workspace.navbarItems.map((item) => item.link),
    ]) {
      const path = normalizeWorkspaceRoute(link);
      if (path !== '/' && (route === path || route.startsWith(path + '/')) && path.length > score) {
        best = workspace;
        score = path.length;
      }
    }
  }
  return (best?.navbarItems || []).map((item) => ({
    ...item,
    link: item.link.replace(/^\/admin(?=\/|$)/, '/adminv2'),
  }));
}
