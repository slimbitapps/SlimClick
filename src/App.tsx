import { useStore } from './store';
import { Onboarding } from './components/Onboarding';
import { Header, Home } from './components/Home';
import { SettingsDialog } from './components/Settings';
import { ApprovalPrompt, HotspotGuide } from './components/Hotspot';

export function App() {
  const ready = useStore((s) => s.ready);
  const onboarded = useStore((s) => s.settings?.onboarded);
  const showIntro = useStore((s) => s.showIntro);
  const dialog = useStore((s) => s.dialog);
  // Sprache/Theme-Wechsel sollen alles neu zeichnen
  useStore((s) => s.settings?.prefs);
  if (!ready) return null;
  return (
    <>
      {!onboarded || showIntro ? (
        <Onboarding />
      ) : (
        <div className="app">
          <Header />
          <Home />
        </div>
      )}
      {dialog?.kind === 'settings' && <SettingsDialog tab={dialog.tab} />}
      {dialog?.kind === 'hotspot' && <HotspotGuide />}
      <ApprovalPrompt />
    </>
  );
}
