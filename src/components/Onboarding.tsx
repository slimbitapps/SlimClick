import { useState } from 'react';
import { t, LANGS } from '../i18n';
import { useStore, updatePrefs, finishOnboarding, refreshPerms } from '../store';
import type { Prefs } from '../types';
import { Logo } from './ui';
import { IconArrowLeft, IconArrowRight, IconCheck, IconShield, IconKeyboard, IconMonitor } from '../icons';
import { IllScan, IllPresent, IllTap } from './illustrations';

/** Einführung beim ersten Start: Sprache → Aussehen → Bedienung → (Mac: Erlaubnisse) → So geht's */
export function Onboarding() {
  const prefs = useStore((s) => s.settings.prefs);
  const perms = useStore((s) => s.perms);
  const isMac = window.api.platform === 'darwin';
  const steps = isMac ? ['lang', 'theme', 'mode', 'perm', 'tour'] : ['lang', 'theme', 'mode', 'tour'];
  const [step, setStep] = useState(0);
  const id = steps[step];
  const last = step === steps.length - 1;
  const next = () => (last ? finishOnboarding() : setStep(step + 1));

  return (
    <div className="onb" data-testid="onboarding">
      <div className="onb-top" />
      <div className="onb-body">
        <div className="onb-panel" key={step}>
          {id === 'lang' && (
            <>
              <div className="row" style={{ justifyContent: 'center' }}>
                <Logo size={64} />
              </div>
              <div className="welcome-words" style={{ marginTop: 18 }}>
                Willkommen · Welcome · Bienvenue · Bienvenido · Benvenuto
              </div>
              <h1>{t('onb.lang.title')}</h1>
              <p className="lead">{t('onb.lang.sub')}</p>
              <div className="choice-grid cols-5">
                {LANGS.map((l) => (
                  <button key={l.id} className={`choice lang-choice ${prefs.lang === l.id ? 'on' : ''}`} onClick={() => updatePrefs({ lang: l.id })} data-testid={`lang-${l.id}`}>
                    <span className="code">{l.id.toUpperCase()}</span>
                    <span className="ch-title">{l.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {id === 'theme' && (
            <>
              <h1>{t('onb.theme.title')}</h1>
              <p className="lead">{t('onb.theme.sub')}</p>
              <div className="choice-grid cols-3">
                {(['light', 'dark', 'system'] as Prefs['theme'][]).map((th) => (
                  <button key={th} className={`choice ${prefs.theme === th ? 'on' : ''}`} onClick={() => updatePrefs({ theme: th })} data-testid={`theme-${th}`}>
                    <div className="theme-preview">
                      <div className={`tp ${th === 'dark' ? 'dark' : 'light'}`}>
                        <i style={{ width: '60%' }} />
                        <b />
                      </div>
                      <div className={`tp ${th === 'light' ? 'light' : 'dark'}`}>
                        <i style={{ width: '40%' }} />
                        <b />
                      </div>
                    </div>
                    <span className="ch-title">{t(`theme.${th}`)}</span>
                    <span className="ch-desc">{t(`theme.${th}.desc`)}</span>
                    <span className="ch-check">
                      <IconCheck size={13} strokeWidth={3} />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {id === 'mode' && (
            <>
              <h1>{t('onb.mode.title')}</h1>
              <p className="lead">{t('onb.mode.sub')}</p>
              <div className="choice-grid cols-2">
                {(['simple', 'expert'] as Prefs['mode'][]).map((m) => (
                  <button key={m} className={`choice ${prefs.mode === m ? 'on' : ''}`} style={{ padding: 20 }} onClick={() => updatePrefs({ mode: m })}>
                    <span className="ch-title" style={{ fontSize: 17 }}>
                      {t(`mode.${m}`)}
                      {m === 'simple' && (
                        <span className="badge accent" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                          {t('mode.recommended')}
                        </span>
                      )}
                    </span>
                    <span className="ch-desc" style={{ marginTop: 4 }}>
                      {t(`mode.${m}.desc`)}
                    </span>
                    <span className="ch-check">
                      <IconCheck size={13} strokeWidth={3} />
                    </span>
                  </button>
                ))}
              </div>
              <p className="faint small" style={{ marginTop: 16 }}>
                {t('onb.mode.hint')}
              </p>
            </>
          )}

          {id === 'perm' && (
            <>
              <h1>{t('onb.perm.title')}</h1>
              <p className="lead">{t('onb.perm.sub')}</p>
              <div className="perm-list">
                {(
                  [
                    ['accessibility', IconKeyboard, 'onb.perm.acc.title', 'onb.perm.acc.text'],
                    ['screen', IconMonitor, 'onb.perm.screen.title', 'onb.perm.screen.text'],
                  ] as const
                ).map(([kind, Icon, title, text]) => {
                  const ok = perms[kind] === 'granted';
                  return (
                    <div className={`perm-card ${ok ? 'ok' : ''}`} key={kind}>
                      <div className="perm-ic">
                        <Icon size={20} />
                      </div>
                      <div className="grow">
                        <div className="perm-t">{t(title)}</div>
                        <div className="small muted">{t(text)}</div>
                      </div>
                      {ok ? (
                        <span className="badge success">
                          <IconCheck size={12} strokeWidth={3} /> {t('onb.perm.granted')}
                        </span>
                      ) : (
                        <button className="btn primary" onClick={() => window.api.permRequest(kind).then(refreshPerms)}>
                          {t('onb.perm.grant')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="faint small" style={{ marginTop: 16 }}>
                {t('onb.perm.how')}
              </p>
            </>
          )}

          {id === 'tour' && (
            <>
              <h1>{t('onb.tour.title')}</h1>
              <p className="lead">{t('onb.tour.sub')}</p>
              <div className="tour">
                {[IllScan, IllPresent, IllTap].map((Ill, i) => (
                  <div key={i} className="tour-card">
                    <div className="ill">
                      <Ill />
                    </div>
                    <h3>
                      <span className="num">{i + 1}</span>
                      {t(`onb.tour.${i + 1}.title` as 'onb.tour.1.title')}
                    </h3>
                    <p>{t(`onb.tour.${i + 1}.text` as 'onb.tour.1.text')}</p>
                  </div>
                ))}
              </div>
              <div className="safe-note">
                <IconShield size={17} />
                {t('onb.safe')}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="onb-foot">
        <div style={{ width: 110 }}>
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              <IconArrowLeft size={16} />
              {t('common.back')}
            </button>
          )}
        </div>
        <div className="steps-dots">
          {steps.map((s, i) => (
            <i key={s} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <div style={{ width: 110, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn primary lg" onClick={next} data-testid="onb-next">
            {last ? t('onb.start') : t('common.next')}
            {!last && <IconArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
