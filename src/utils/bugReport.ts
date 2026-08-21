import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { openExternal } from './dialogs';

export const BUG_REPORT_EMAIL = 'eddy.winders@gmail.com';
const GITHUB_REPO = 'Windersugoi/mcdecks';


function deviceInfo(): string {
  const ver = Constants.expoConfig?.version ?? '?';
  const platform = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
  return `App: MCDecks v${ver}\nPlataforma: ${platform}`;
}

function buildBody(description: string): string {
  const desc = description.trim() || '(sin descripción)';
  return `${desc}\n\n---\n${deviceInfo()}`;
}

export function openBugReportEmail(description: string) {
  const subject = 'MCDecks — Reporte de bug';
  const url = `mailto:${BUG_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildBody(description))}`;
  openExternal(url);
}

export function openBugReportGithub(description: string) {
  const title = description.trim().slice(0, 60) || 'Bug report';
  const url = `https://github.com/${GITHUB_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(buildBody(description))}&labels=bug`;
  openExternal(url);
}
