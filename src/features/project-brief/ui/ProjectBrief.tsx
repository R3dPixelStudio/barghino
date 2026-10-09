'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/shared/config/locale';
import { questions } from '../model/questions';

type Answers = {
  type: string;
  phase: string;
  services: string[];
  timeline: string;
};
export function ProjectBrief({ locale }: { locale: Locale }) {
  const fa = locale === 'fa';
  const t = (persian: string, english: string) => (fa ? persian : english);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    type: '',
    phase: '',
    services: [],
    timeline: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const heading = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const question = questions[locale][step];
  const selected = question ? answers[question.key] : '';
  const valid = Array.isArray(selected) ? selected.length > 0 : !!selected;
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current && step >= 0) heading.current?.focus({ preventScroll: true });
  }, [step]);
  function move(next: number) {
    moved.current = true;
    setStep(next);
  }
  function choose(value: string) {
    if (!question) return;
    if (question.key === 'services')
      setAnswers((current) => ({
        ...current,
        services: current.services.includes(value)
          ? current.services.filter((item) => item !== value)
          : [...current.services, value],
      }));
    else setAnswers((current) => ({ ...current, [question.key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setStatus('sending');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          name: form.get('name'),
          contact: form.get('contact'),
          location: form.get('location'),
          message: form.get('message') || '',
          website: form.get('website') || '',
          locale,
        }),
      });
      if (!response.ok) throw new Error('Unable to submit');
      setStatus('sent');
    } catch {
      setStatus('error');
    } finally {
      submitting.current = false;
    }
  }
  return (
    <div className="guided-brief" data-step={step}>
      <nav className="brief-progress" aria-label={t('مراحل تعریف پروژه', 'Project brief progress')}>
        {questions[locale].map((item, index) => (
          <button
            key={item.key}
            type="button"
            disabled={index > step || status === 'sending' || status === 'sent'}
            aria-current={step === index ? 'step' : undefined}
            onClick={() => move(index)}
          >
            <span>0{index + 1}</span>
            <i />
          </button>
        ))}
        <span className="brief-contact-step">{t('اتصال', 'CONNECT')}</span>
      </nav>
      {status === 'sent' ? (
        <div className="brief-success" role="status">
          <span aria-hidden="true">↗</span>
          <h3>{t('مسیر پروژهٔ شما مشخص شد.', 'Your next connection is taking shape.')}</h3>
          <p>
            {t(
              'خلاصهٔ درخواست و اطلاعات تماس شما ثبت شد.',
              'Your project brief and contact details have been received.',
            )}
          </p>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setStatus('idle');
              setStep(0);
              setAnswers({ type: '', phase: '', services: [], timeline: '' });
            }}
          >
            {t('تعریف پروژهٔ دیگر', 'Start another brief')}
          </button>
        </div>
      ) : question ? (
        <div className="brief-question" key={question.key}>
          <span className="brief-step-count" dir="ltr">
            0{step + 1} / 04
          </span>
          <h3 ref={heading} tabIndex={-1}>
            {question.title}
          </h3>
          <p>{question.hint}</p>
          <fieldset className="brief-choices">
            <legend className="sr-only">{question.title}</legend>
            {question.options.map((option, index) => (
              <label
                key={option.value}
                className="brief-choice"
                data-selected={
                  Array.isArray(selected)
                    ? selected.includes(option.value)
                    : selected === option.value
                }
              >
                <input
                  type={question.key === 'services' ? 'checkbox' : 'radio'}
                  name={question.key}
                  value={option.value}
                  checked={
                    Array.isArray(selected)
                      ? selected.includes(option.value)
                      : selected === option.value
                  }
                  onChange={() => choose(option.value)}
                />
                <span className="choice-index" aria-hidden="true">
                  0{index + 1}
                </span>
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.detail}</small>
                </span>
                <span className="choice-check" aria-hidden="true">
                  ＋
                </span>
              </label>
            ))}
          </fieldset>
          <div className="brief-actions">
            <button
              className="text-button"
              type="button"
              disabled={step === 0}
              onClick={() => move(step - 1)}
            >
              {t('بازگشت', 'Back')}
            </button>
            <button
              className="solid-button"
              type="button"
              disabled={!valid}
              onClick={() => move(step + 1)}
            >
              {step === 3
                ? t('ثبت راه ارتباطی', 'Make the connection')
                : t('سؤال بعدی', 'Next question')}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="brief-contact-form">
          <span className="brief-step-count" dir="ltr">
            YOUR PROJECT / LET’S CONNECT
          </span>
          <h3 ref={heading} tabIndex={-1}>
            {t('چطور با شما در ارتباط باشیم؟', 'How can we reach you?')}
          </h3>
          <div className="brief-summary">
            {questions[locale].map((item) => {
              const value = answers[item.key];
              return (
                <span key={item.key}>
                  {item.options
                    .filter((option) =>
                      Array.isArray(value) ? value.includes(option.value) : value === option.value,
                    )
                    .map((option) => option.title)
                    .join(' · ')}
                </span>
              );
            })}
          </div>
          <div className="field-pair">
            <label>
              {t('نام شما', 'Your name')}
              <input name="name" required autoComplete="name" maxLength={100} />
            </label>
            <label>
              {t('شماره تماس یا ایمیل', 'Phone or email')}
              <input name="contact" required autoComplete="email" dir="auto" maxLength={180} />
            </label>
          </div>
          <label>
            {t('شهر یا محل پروژه (اختیاری)', 'Project location (optional)')}
            <input name="location" autoComplete="address-level2" maxLength={120} />
          </label>
          <label>
            {t('یادداشت شما (اختیاری)', 'Your notes (optional)')}
            <textarea
              name="message"
              rows={3}
              maxLength={3000}
              placeholder={t(
                'متراژ، تعداد واحدها یا نکته‌ای که برای شما مهم است…',
                'Floor area, number of units, or anything that matters to you…',
              )}
            />
          </label>
          <div className="honey-field" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className="form-note">
            {t(
              'اطلاعات شما برای بررسی همین درخواست پروژه استفاده می‌شود.',
              'Your details are used to review this project enquiry.',
            )}
          </p>
          {status === 'error' && (
            <p className="form-error" role="alert">
              {t(
                'ثبت نشد. دوباره تلاش کنید؛ انتخاب‌های شما حفظ شده است.',
                'Could not submit. Your choices are still here—please retry.',
              )}
            </p>
          )}
          <div className="brief-actions">
            <button
              className="text-button"
              type="button"
              disabled={status === 'sending'}
              onClick={() => move(3)}
            >
              {t('بازگشت', 'Back')}
            </button>
            <button className="solid-button" type="submit" disabled={status === 'sending'}>
              {status === 'sending'
                ? t('در حال ثبت…', 'Sending…')
                : t('شروع گفت‌وگو دربارهٔ پروژه', 'Start the project conversation')}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
