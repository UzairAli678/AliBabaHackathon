import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL as backendBaseUrl } from '../lib/api';

function inferSpecialistForDisease(disease) {
  const lowerDisease = disease.toLowerCase();

  if (/(skin|rash|fungal|allergy|eczema|psoriasis|itch|urticaria|acne)/.test(lowerDisease)) {
    return 'Dermatologist';
  }

  if (/(asthma|pneumonia|bronchial|tuberculosis|respiratory|cough|chest)/.test(lowerDisease)) {
    return 'Pulmonologist';
  }

  if (/(gastr|ulcer|acidity|stomach|hepatitis|jaundice|liver|digestive|indigestion|diarrhea|vomiting)/.test(lowerDisease)) {
    return 'Gastroenterologist';
  }

  if (/(heart attack|cardiac|heart|blood pressure|hypertension)/.test(lowerDisease)) {
    return 'Cardiologist';
  }

  if (/(urinary|kidney|renal|bladder|uti|urination)/.test(lowerDisease)) {
    return 'Urologist';
  }

  if (/(migraine|vertigo|paralysis|neuro|brain|stroke|meningitis|dementia)/.test(lowerDisease)) {
    return 'Neurologist';
  }

  if (/(eye|vision|conjunctivitis|cataract|glaucoma)/.test(lowerDisease)) {
    return 'Ophthalmologist';
  }

  if (/(ear|throat|sinus|tonsil|nose|hearing)/.test(lowerDisease)) {
    return 'ENT Specialist';
  }

  if (/(joint|bone|arthritis|back|muscle|sprain|orthopedic)/.test(lowerDisease)) {
    return 'Orthopedic Specialist';
  }

  if (/(diabetes|thyroid|obesity|hormone|endocrine)/.test(lowerDisease)) {
    return 'Endocrinologist';
  }

  if (/(depression|anxiety|mental|psychi|stress)/.test(lowerDisease)) {
    return 'Psychiatrist';
  }

  return 'General Physician';
}

function confidenceToTone(confidence) {
  if (confidence > 70) {
    return 'positive';
  }

  if (confidence >= 40) {
    return 'primary';
  }

  return 'caution';
}

function getConfidenceLabel(confidence) {
  if (confidence > 70) {
    return 'High confidence';
  }

  if (confidence >= 40) {
    return 'Moderate confidence';
  }

  return 'Low confidence';
}

function getConfidenceBadgeClasses(tone) {
  if (tone === 'positive') {
    return 'border-green-200 bg-mintSoft text-positive';
  }

  if (tone === 'primary') {
    return 'border-teal-200 bg-tealSoft text-primary';
  }

  return 'border-amber-200 bg-amberSoft text-caution';
}

function formatSelectedSymptoms(symptoms) {
  return symptoms.join(', ');
}

function sortSymptoms(symptoms) {
  return [...symptoms].sort((left, right) => left.localeCompare(right));
}

export default function DiseasePredictionPage() {
  const navigate = useNavigate();
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState('');
  const [result, setResult] = useState(null);
  const [followUpAnswers, setFollowUpAnswers] = useState({});

  useEffect(() => {
    let active = true;

    const loadSymptoms = async () => {
      setLoadingSymptoms(true);
      setLoadError('');

      try {
        const response = await fetch(`${backendBaseUrl}/health-assessment/symptoms-list`, {
          headers: { Accept: 'application/json' }
        });

        const data = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok || !Array.isArray(data?.symptoms)) {
          throw new Error('Unable to load symptoms.');
        }

        setAvailableSymptoms(sortSymptoms(data.symptoms));
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadError('Unable to load the symptom checklist from the backend.');
        setAvailableSymptoms([]);
      } finally {
        if (active) {
          setLoadingSymptoms(false);
        }
      }
    };

    loadSymptoms();

    return () => {
      active = false;
    };
  }, []);

  const filteredSymptoms = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const remainingSymptoms = availableSymptoms.filter((symptom) => !selectedSymptoms.includes(symptom));

    if (!query) {
      return remainingSymptoms;
    }

    return remainingSymptoms.filter((symptom) => symptom.toLowerCase().includes(query));
  }, [availableSymptoms, searchText, selectedSymptoms]);

  const groupedSymptoms = useMemo(() => {
    const groups = new Map();

    filteredSymptoms.forEach((symptom) => {
      const groupKey = symptom[0]?.toUpperCase() || '#';
      const items = groups.get(groupKey) || [];
      items.push(symptom);
      groups.set(groupKey, items);
    });

    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [filteredSymptoms]);

  const topPrediction = result?.predictions?.[0] || null;
  const alternatePredictions = result?.predictions?.slice(1, 3) || [];
  const selectedCount = selectedSymptoms.length;
  const canPredict = selectedCount >= 2;
  const selectedSymptomsForDisplay = result?.selectedSymptoms || selectedSymptoms;
  const topConfidenceTone = topPrediction ? confidenceToTone(topPrediction.confidence) : 'caution';
  const topConfidenceLabel = topPrediction ? getConfidenceLabel(topPrediction.confidence) : '';

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((current) => {
      if (current.includes(symptom)) {
        return current.filter((item) => item !== symptom);
      }

      return [...current, symptom];
    });
  };

  const handlePredict = async () => {
    if (!canPredict) {
      return;
    }

    setPredictionLoading(true);
    setPredictionError('');

    const serializedFollowUpAnswers = Object.fromEntries(
      Object.entries(followUpAnswers).map(([questionId, answer]) => [
        questionId,
        answer?.choice === 'Other' ? answer.otherText?.trim() || 'Other' : answer?.choice || ''
      ])
    );

    try {
      const response = await fetch(`${backendBaseUrl}/health-assessment/predict-disease`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          follow_up_answers: serializedFollowUpAnswers
        })
      });

      if (!response.ok) {
        throw new Error('Prediction request failed.');
      }

      const data = await response.json();
      const predictions = (data.predictions || []).map((prediction) => ({
        ...prediction,
        confidence: Math.round(((prediction.final_score ?? prediction.probability ?? 0) || 0) * 100),
        specialist: prediction.recommended_specialist || prediction.specialist || inferSpecialistForDisease(prediction.disease)
      }));

      setResult({
        selectedSymptoms: data.selected_symptoms || selectedSymptoms,
        predictions,
        bestPrediction: data.best_prediction || predictions[0] || null,
        followUpQuestions: data.follow_up_questions || [],
        confidenceThresholdMet: Boolean(data.confidence_threshold_met)
      });
      setFollowUpAnswers({});
    } catch (error) {
      setPredictionError(error instanceof Error ? error.message : 'Unable to predict disease.');
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleFindSpecialists = () => {
    if (!topPrediction) {
      return;
    }

    const specialist = topPrediction.specialist || inferSpecialistForDisease(topPrediction.disease);

    navigate('/navigator', {
      state: {
        specialist,
        assessment: {
          score: topPrediction.confidence,
          riskLevel: topPrediction.confidence >= 75 ? 'high' : topPrediction.confidence >= 50 ? 'medium' : 'low',
          urgency: topPrediction.confidence >= 75 ? 'needs attention' : 'mild',
          suggestion: `Recommended specialist: ${specialist}`,
          symptoms: result?.selectedSymptoms || selectedSymptoms,
          topDisease: topPrediction.disease,
          suggestedSpecialist: specialist
        }
      }
    });
  };

  const handleAddMoreSymptoms = () => {
    setResult(null);
  };

  const handleFollowUpAnswerChange = (questionId, value) => {
    setFollowUpAnswers((current) => ({
      ...current,
      [questionId]: { choice: value, otherText: current[questionId]?.otherText || '' }
    }));
  };

  const handleFollowUpOtherTextChange = (questionId, value) => {
    setFollowUpAnswers((current) => ({
      ...current,
      [questionId]: { choice: 'Other', otherText: value }
    }));
  };

  const followUpAnsweredCount = result?.followUpQuestions?.filter((question) => {
    const answer = followUpAnswers[question.id];
    return Boolean(answer?.choice && (answer.choice !== 'Other' || answer.otherText.trim()));
  }).length || 0;

  if (result && topPrediction) {
    const showLowConfidenceBanner = !result.confidenceThresholdMet || topPrediction.confidence < 50;

    return (
      <div className="space-y-6">
        {showLowConfidenceBanner ? (
          <section className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 shadow-card sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-caution">
                Confidence is higher with more symptoms selected. Try adding a few more for a clearer result.
              </p>
              <button
                type="button"
                onClick={handleAddMoreSymptoms}
                className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-caution transition hover:bg-amber-50"
              >
                Add more symptoms
              </button>
            </div>
          </section>
        ) : null}

        {!result.confidenceThresholdMet && result.followUpQuestions?.length ? (
          <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Follow-up questions</div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-heading">Answer these to improve accuracy</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              The model needs a little more context before finalizing a higher-confidence result.
            </p>
            <div className="mt-5 space-y-4">
              {result.followUpQuestions.map((question) => {
                const currentAnswer = followUpAnswers[question.id] || { choice: '', otherText: '' };
                const showOtherInput = currentAnswer.choice === 'Other';

                return (
                  <div key={question.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="font-medium text-heading">{question.question}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {question.options.map((option) => {
                        const isSelected = currentAnswer.choice === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleFollowUpAnswerChange(question.id, option)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              isSelected
                                ? 'border-primary bg-white text-heading shadow-card'
                                : 'border-border bg-white text-muted hover:border-primary/40 hover:text-heading'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {showOtherInput ? (
                      <input
                        type="text"
                        value={currentAnswer.otherText}
                        onChange={(event) => handleFollowUpOtherTextChange(question.id, event.target.value)}
                        placeholder="Please describe"
                        className="mt-4 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-heading outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-muted">
              <span>{followUpAnsweredCount} of {result.followUpQuestions.length} answered</span>
              <button
                type="button"
                onClick={handlePredict}
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
              >
                Re-run prediction
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Based on</span>
                {selectedSymptomsForDisplay.map((symptom) => (
                  <span
                    key={symptom}
                    className="inline-flex items-center rounded-full border border-border bg-slate-50 px-3 py-1 text-xs font-medium text-heading"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${getConfidenceBadgeClasses(topConfidenceTone)}`}>
                AI prediction ready
              </div>
              <h2 className="text-3xl font-medium tracking-tight text-heading sm:text-4xl">{topPrediction.disease}</h2>
              <p className="text-sm leading-7 text-muted">
                The model ranked this condition highest based on the selected symptoms.
              </p>

              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4 text-sm font-medium text-heading">
                  <span>Confidence</span>
                  <span className="inline-flex items-center gap-2">
                    <span>{topPrediction.confidence}%</span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getConfidenceBadgeClasses(topConfidenceTone)}`}>
                      {topConfidenceLabel}
                    </span>
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${topConfidenceTone === 'positive' ? 'bg-positive' : topConfidenceTone === 'primary' ? 'bg-primary' : 'bg-caution'}`}
                    style={{ width: `${topPrediction.confidence}%` }}
                  />
                </div>
                <div className="mt-4 rounded-2xl border border-border bg-white p-4 text-sm leading-7 text-muted">
                  <div className="font-medium text-heading">Recommended specialist</div>
                  <p className="mt-1 text-muted">{topPrediction.specialist}</p>
                </div>
                {!result.confidenceThresholdMet ? (
                  <p className="mt-4 text-sm leading-7 text-muted">
                    This result is preliminary. Add more symptoms or answer the follow-up questions above for a clearer prediction.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-[28px] border border-border bg-slate-50 px-6 py-5 text-center shadow-card">
                <div className="text-sm uppercase tracking-[0.2em] text-primary">Top result</div>
                <div className="mt-2 text-2xl font-medium tracking-tight text-heading">{topPrediction.confidence}% match</div>
                <div className={`mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getConfidenceBadgeClasses(topConfidenceTone)}`}>
                  {topConfidenceLabel}
                </div>
                <div className="mt-3 text-sm text-muted">{topPrediction.specialist}</div>
              </div>
              <button
                type="button"
                onClick={handleFindSpecialists}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
              >
                Find specialists near me
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {alternatePredictions.map((prediction) => (
            <article key={prediction.disease} className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Alternative</div>
                  <h3 className="mt-2 text-2xl font-medium tracking-tight text-heading">{prediction.disease}</h3>
                </div>
                <div className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-heading">{prediction.confidence}%</div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-500" style={{ width: `${prediction.confidence}%` }} />
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-muted">
                <div className="font-medium text-heading">Recommended specialist</div>
                <p className="mt-1 text-muted">{prediction.specialist}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-border bg-slate-50 p-6 shadow-card">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Disclaimer</div>
          <p className="mt-3 text-sm leading-7 text-muted">
            This is an AI-generated estimate based on symptom patterns, not a medical diagnosis. Please consult a licensed doctor for confirmation.
          </p>
          <button
            type="button"
            onClick={handleAddMoreSymptoms}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-heading transition hover:bg-slate-50"
          >
            Add more symptoms
          </button>
        </section>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-tealSoft px-4 py-2 text-sm font-medium text-primary">
              <SparklesIcon className="h-4 w-4" />
              Disease Prediction
            </div>
            <h2 className="mt-5 text-3xl font-medium tracking-tight text-heading sm:text-4xl">Select your symptoms and let AI narrow down likely conditions</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Search the live checklist, pick 2 or more symptoms, and submit them to the disease prediction model.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm leading-7 text-heading">
            <div className="font-medium text-heading">Selected symptoms</div>
            <p className="mt-1 text-muted">{selectedCount} symptoms selected — more symptoms improve prediction accuracy</p>
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Symptoms</div>
              <h3 className="mt-2 text-2xl font-medium tracking-tight text-heading">Search the checklist</h3>
            </div>
            <div className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-heading">
              {loadingSymptoms ? 'Loading...' : `${availableSymptoms.length} symptoms available`}
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search symptoms"
                className="w-full rounded-2xl border border-border bg-slate-50 py-3 pl-12 pr-4 text-sm text-heading outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedSymptoms.length ? selectedSymptoms.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-tealSoft px-4 py-2 text-sm font-medium text-primary transition hover:border-primary/30"
              >
                {symptom}
                <XMarkIcon className="h-4 w-4" />
              </button>
            )) : (
              <div className="text-sm text-muted">Select at least 2 symptoms to enable prediction.</div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {loadingSymptoms ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-muted">Loading symptom checklist...</div>
            ) : loadError ? (
              <div className="rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{loadError}</div>
            ) : groupedSymptoms.length ? (
              groupedSymptoms.map(([group, symptoms]) => (
                <div key={group} className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">{group}</div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {symptoms.map((symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom);

                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => toggleSymptom(symptom)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                            isSelected
                              ? 'border-primary bg-white text-heading shadow-card'
                              : 'border-border bg-slate-50 text-muted hover:border-primary/40 hover:bg-white'
                          }`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-muted">No symptoms match your search.</div>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Prediction settings</div>
            <h3 className="mt-2 text-2xl font-medium tracking-tight text-heading">Ready to predict</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Pick a few symptoms that best describe what you are feeling, then ask the model to rank likely conditions.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-muted">
              <div className="font-medium text-heading">Checklist tip</div>
              <p className="mt-1 text-muted">Use the search box for faster filtering. Selected symptoms stay pinned above the list.</p>
            </div>

            {predictionError ? (
              <div className="mt-4 rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{predictionError}</div>
            ) : null}

            <button
              type="button"
              onClick={handlePredict}
              disabled={!canPredict || predictionLoading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {predictionLoading ? 'Predicting...' : 'Predict'}
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            <p className="mt-4 text-xs leading-6 text-muted">
              Select at least 2 symptoms before predicting. More specific symptom combinations usually produce clearer results.
            </p>
          </section>

          <section className="rounded-[28px] border border-border bg-slate-50 p-6 shadow-card">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Medical disclaimer</div>
            <p className="mt-3 text-sm leading-7 text-muted">
              This is an AI-generated estimate based on symptom patterns, not a medical diagnosis. Please consult a licensed doctor for confirmation.
            </p>
          </section>
        </aside>
      </section>
    </section>
  );
}
