import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  themes,
  allLanguageModes,
  allKeySkills,
  allSocietyAspects,
  contextOptions,
  getThemeLanguageModes,
  getThemeKeySkills,
  getThemeSocietyAspects,
  getKeySkillOccurrences,
  grootReward
} from '../../data/curriculum';
import { LogOut, BookOpen, List, BarChart3, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export default function LearnerDashboard() {
  const { signOut, currentUser, userData } = useAuth();

  const [activeTab, setActiveTab] = useState('practice');
  const [practiceEntries, setPracticeEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Üben-Tab State
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [selectedContext, setSelectedContext] = useState('schule');
  const [additionalLanguageModes, setAdditionalLanguageModes] = useState([]);
  const [additionalKeySkills, setAdditionalKeySkills] = useState([]);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  // Statistik State
  const [expandedSkill, setExpandedSkill] = useState(null);

  // Load practice entries
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      setLoading(true);
      try {
        const pq = query(
          collection(db, 'practiceEntries'),
          where('learnerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const ps = await getDocs(pq);
        const data = ps.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() ? d.data().createdAt.toDate() : null
        }));
        setPracticeEntries(data);
      } catch (err) {
        console.error('Error loading entries:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  // Berechnete Werte für aktuelles Thema
  const currentTheme = useMemo(() => themes.find(t => t.id === selectedThemeId), [selectedThemeId]);
  const themeLanguageModes = useMemo(() => selectedThemeId ? getThemeLanguageModes(selectedThemeId) : [], [selectedThemeId]);
  const themeKeySkills = useMemo(() => selectedThemeId ? getThemeKeySkills(selectedThemeId) : [], [selectedThemeId]);
  const themeSocietyAspects = useMemo(() => selectedThemeId ? getThemeSocietyAspects(selectedThemeId) : [], [selectedThemeId]);

  // Optionale Sprachmodi (die nicht bereits Pflicht sind)
  const optionalLanguageModes = useMemo(() => {
    if (!currentTheme) return allLanguageModes;
    return allLanguageModes.filter(m => !currentTheme.mandatoryLanguageModes.includes(m.id));
  }, [currentTheme]);

  // Optionale Schlüsselkompetenzen (die nicht bereits Pflicht sind)
  const optionalKeySkills = useMemo(() => {
    if (!currentTheme) return allKeySkills;
    const mandatoryIds = currentTheme.mandatoryKeySkills.map(s => s.id);
    return allKeySkills.filter(s => !mandatoryIds.includes(s.id));
  }, [currentTheme]);

  // Übung speichern
  const saveEntry = async () => {
    if (!selectedThemeId || !currentUser) return;

    setSaving(true);
    try {
      const theme = themes.find(t => t.id === selectedThemeId);

      const entry = {
        learnerId: currentUser.uid,
        teacherId: userData?.teacherId || null,
        classId: userData?.classId || null,
        themeId: selectedThemeId,
        // Pflicht
        mandatoryLanguageModes: theme.mandatoryLanguageModes,
        mandatorySociety: theme.mandatorySociety,
        mandatoryKeySkills: theme.mandatoryKeySkills.map(s => `${s.id}-${s.round}`),
        // Freiwillig
        additionalLanguageModes,
        additionalKeySkills,
        // Kontext & Reflexion
        context: selectedContext,
        reflection: reflection.trim(),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'practiceEntries'), entry);

      // State aktualisieren
      setPracticeEntries(prev => [{
        id: docRef.id,
        ...entry,
        createdAt: new Date()
      }, ...prev]);

      // Formular zurücksetzen
      setReflection('');
      setAdditionalLanguageModes([]);
      setAdditionalKeySkills([]);
      setShowOptional(false);

      alert('Eintrag gespeichert! ✓');
    } catch (err) {
      console.error('Error saving entry:', err);
      alert('Fehler beim Speichern: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle optionale Auswahl
  const toggleAdditionalLanguageMode = (modeId) => {
    setAdditionalLanguageModes(prev =>
      prev.includes(modeId)
        ? prev.filter(id => id !== modeId)
        : [...prev, modeId]
    );
  };

  const toggleAdditionalKeySkill = (skillId) => {
    setAdditionalKeySkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  // Statistik-Berechnungen
  const statistics = useMemo(() => {
    const stats = {
      totalEntries: practiceEntries.length,
      entriesByTheme: {},
      skillProgress: {},
      voluntaryCount: 0
    };

    // Einträge pro Thema
    for (const theme of themes) {
      stats.entriesByTheme[theme.id] = practiceEntries.filter(e => e.themeId === theme.id).length;
    }

    // Schlüsselkompetenzen-Fortschritt
    for (const skill of allKeySkills) {
      const occurrences = getKeySkillOccurrences(skill.id);
      const completedOccurrences = occurrences.filter(occ => {
        return practiceEntries.some(e =>
          e.themeId === occ.themeId &&
          e.mandatoryKeySkills?.includes(`${skill.id}-${occ.round}`)
        );
      });
      stats.skillProgress[skill.id] = {
        total: occurrences.length,
        completed: completedOccurrences.length,
        percent: occurrences.length > 0 ? Math.round((completedOccurrences.length / occurrences.length) * 100) : 0,
        occurrences
      };
    }

    // Freiwillige Übungen zählen
    stats.voluntaryCount = practiceEntries.reduce((count, e) => {
      return count + (e.additionalLanguageModes?.length || 0) + (e.additionalKeySkills?.length || 0);
    }, 0);

    return stats;
  }, [practiceEntries]);

  // Datum formatieren
  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{userData?.animalEmoji || '👤'}</span>
            <div>
              <h1 className="font-bold text-gray-900">stud-i-agency-check</h1>
              <p className="text-sm text-gray-600">{userData?.animalName || userData?.name || 'Lernende/r'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-[60px] z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${activeTab === 'practice' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              <BookOpen className="w-4 h-4" /> Üben
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${activeTab === 'entries' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              <List className="w-4 h-4" /> Einträge
              {practiceEntries.length > 0 && (
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{practiceEntries.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${activeTab === 'stats' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              <BarChart3 className="w-4 h-4" /> Statistik
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab: Üben */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* Thema wählen */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">1. Thema wählen</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`p-3 rounded-xl border-2 text-left transition ${selectedThemeId === theme.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-2xl font-bold text-gray-400">{theme.order}</div>
                    <div className="text-sm font-medium mt-1">{theme.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pflichtprogramm anzeigen */}
            {selectedThemeId && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">2. Pflichtprogramm für «{currentTheme?.title}»</h2>

                {/* Sprachmodi */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Sprachmodi (Pflicht)</h3>
                  <div className="flex flex-wrap gap-2">
                    {themeLanguageModes.map(mode => (
                      <span key={mode.id} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                        <Check className="w-3 h-3" /> {mode.short}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Schlüsselkompetenzen */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Schlüsselkompetenzen (Pflicht)</h3>
                  <div className="space-y-2">
                    {themeKeySkills.map(skill => (
                      <div key={`${skill.id}-${skill.round}`} className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{skill.id} ({skill.round})</span>
                          <span className="text-purple-600 ml-1">– {skill.short}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gesellschaftsinhalte */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Gesellschaftsinhalte</h3>
                  <div className="flex flex-wrap gap-2">
                    {themeSocietyAspects.map(aspect => (
                      <span key={aspect.id} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
                        {aspect.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Freiwilliges Üben */}
            {selectedThemeId && (
              <div className="bg-white rounded-2xl shadow p-6">
                <button
                  onClick={() => setShowOptional(!showOptional)}
                  className="w-full flex items-center justify-between"
                >
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-600" /> 3. Freiwillig üben (optional)
                  </h2>
                  {showOptional ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {showOptional && (
                  <div className="mt-4 space-y-4">
                    {/* Zusätzliche Sprachmodi */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Zusätzliche Sprachmodi</h3>
                      <div className="flex flex-wrap gap-2">
                        {optionalLanguageModes.map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => toggleAdditionalLanguageMode(mode.id)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition ${additionalLanguageModes.includes(mode.id)
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}
                          >
                            {additionalLanguageModes.includes(mode.id) && <Check className="w-3 h-3 inline mr-1" />}
                            {mode.short}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Zusätzliche Schlüsselkompetenzen */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Zusätzliche Schlüsselkompetenzen</h3>
                      <div className="grid md:grid-cols-2 gap-2">
                        {optionalKeySkills.map(skill => (
                          <button
                            key={skill.id}
                            onClick={() => toggleAdditionalKeySkill(skill.id)}
                            className={`px-3 py-2 rounded-lg text-sm border text-left transition ${additionalKeySkills.includes(skill.id)
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}
                          >
                            {additionalKeySkills.includes(skill.id) && <Check className="w-3 h-3 inline mr-1" />}
                            {skill.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Kontext & Reflexion */}
            {selectedThemeId && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">4. Kontext & Reflexion</h2>

                {/* Kontext */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Wo hast du geübt?</h3>
                  <div className="flex flex-wrap gap-2">
                    {contextOptions.map(ctx => (
                      <button
                        key={ctx.id}
                        onClick={() => setSelectedContext(ctx.id)}
                        className={`px-4 py-2 rounded-lg border transition ${selectedContext === ctx.id
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                      >
                        {ctx.emoji} {ctx.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reflexion */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Reflexion (optional)</h3>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Was hast du gelernt? Was war schwierig? Was nimmst du mit?"
                    className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                  />
                </div>

                {/* Speichern */}
                <button
                  onClick={saveEntry}
                  disabled={saving || !selectedThemeId}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Speichere...' : 'Eintrag speichern'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Einträge */}
        {activeTab === 'entries' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Lade Einträge...</div>
            ) : practiceEntries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-gray-600">Noch keine Einträge. Starte mit dem Üben!</p>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Jetzt üben
                </button>
              </div>
            ) : (
              practiceEntries.map(entry => {
                const theme = themes.find(t => t.id === entry.themeId);
                const voluntaryCount = (entry.additionalLanguageModes?.length || 0) + (entry.additionalKeySkills?.length || 0);
                return (
                  <div key={entry.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{theme?.title || 'Unbekanntes Thema'}</div>
                        <div className="text-sm text-gray-500">{formatDate(entry.createdAt)}</div>
                      </div>
                      {voluntaryCount >= 3 && (
                        <span className="text-2xl" title="3+ freiwillige Übungen!">{grootReward.emoji}</span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {/* Pflicht-Sprachmodi */}
                      {entry.mandatoryLanguageModes?.map(modeId => {
                        const mode = allLanguageModes.find(m => m.id === modeId);
                        return (
                          <span key={modeId} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            {mode?.short || modeId}
                          </span>
                        );
                      })}
                      {/* Freiwillige Sprachmodi */}
                      {entry.additionalLanguageModes?.map(modeId => {
                        const mode = allLanguageModes.find(m => m.id === modeId);
                        return (
                          <span key={modeId} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            +{mode?.short || modeId}
                          </span>
                        );
                      })}
                    </div>

                    {entry.reflection && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-2">
                        {entry.reflection}
                      </div>
                    )}

                    {entry.teacherNote && (
                      <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                        <span className="font-medium">Lehrperson:</span> {entry.teacherNote}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Statistik */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Übersicht */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Übersicht</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600">{statistics.totalEntries}</div>
                  <div className="text-sm text-gray-600">Einträge</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">{statistics.voluntaryCount}</div>
                  <div className="text-sm text-gray-600">Freiwillig</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <div className="text-3xl font-bold text-yellow-600">
                    {statistics.voluntaryCount >= 3 ? grootReward.emoji : '—'}
                  </div>
                  <div className="text-sm text-gray-600">Groot</div>
                </div>
              </div>
            </div>

            {/* Fortschritt pro Thema */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Fortschritt pro Thema</h2>
              <div className="space-y-3">
                {themes.map(theme => {
                  const count = statistics.entriesByTheme[theme.id] || 0;
                  return (
                    <div key={theme.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                        {theme.order}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{theme.title}</div>
                        <div className="h-2 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-2 bg-blue-600 rounded-full transition-all"
                            style={{ width: `${Math.min(count * 20, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 w-8 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zirkularität: Schlüsselkompetenzen */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Schlüsselkompetenzen (Zirkularität)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Jede Kompetenz kommt in 2 Themen vor (R1 = Einführung, R2 = Vertiefung)
              </p>
              <div className="space-y-3">
                {allKeySkills.map(skill => {
                  const progress = statistics.skillProgress[skill.id];
                  const isExpanded = expandedSkill === skill.id;
                  return (
                    <div key={skill.id} className="border rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50"
                      >
                        {/* Prozentkreis */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                            <circle
                              cx="24" cy="24" r="20"
                              stroke={progress?.percent === 100 ? '#22c55e' : '#3b82f6'}
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${(progress?.percent || 0) * 1.26} 126`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {progress?.percent || 0}%
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{skill.short}</div>
                          <div className="text-xs text-gray-500">{skill.id} · {progress?.completed || 0}/{progress?.total || 0}</div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && progress?.occurrences && (
                        <div className="px-3 pb-3 border-t bg-gray-50">
                          <div className="pt-3 space-y-2">
                            {progress.occurrences.map(occ => {
                              const isCompleted = practiceEntries.some(e =>
                                e.themeId === occ.themeId &&
                                e.mandatoryKeySkills?.includes(`${skill.id}-${occ.round}`)
                              );
                              return (
                                <div key={`${occ.themeId}-${occ.round}`} className="flex items-center gap-2 text-sm">
                                  {isCompleted ? (
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  ) : (
                                    <span className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                                  )}
                                  <span className={isCompleted ? 'text-gray-900' : 'text-gray-500'}>
                                    {occ.themeTitle} ({occ.round})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
