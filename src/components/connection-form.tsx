"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ConnectionFormState, ConnectionFormValues } from "@/lib/connections/form";
import {
  KINDS,
  KIND_LABELS,
  REACH_OUTS,
  REACH_OUT_LABELS,
  REASONS,
  REASON_LABELS,
  STAGES,
  STAGE_LABELS,
  TYPES,
  TYPE_LABELS,
} from "@/lib/connections/labels";

type Action = (prev: ConnectionFormState, formData: FormData) => Promise<ConnectionFormState>;

export function ConnectionForm({
  action,
  initial,
  submitLabel,
  cancelHref,
  places,
}: {
  action: Action;
  initial: ConnectionFormValues;
  submitLabel: string;
  cancelHref: string;
  places: { name: string; region: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(action, { values: initial, errors: {} });

  // Remount after each failed save so fields show what was submitted.
  return (
    <FormBody
      key={state.attempt ?? 0}
      state={state}
      formAction={formAction}
      pending={pending}
      submitLabel={submitLabel}
      cancelHref={cancelHref}
      places={places}
    />
  );
}

function FormBody({
  state,
  formAction,
  pending,
  submitLabel,
  cancelHref,
  places,
}: {
  state: ConnectionFormState;
  formAction: (fd: FormData) => void;
  pending: boolean;
  submitLabel: string;
  cancelHref: string;
  places: { name: string; region: string | null }[];
}) {
  const { values: v, errors } = state;
  const [links, setLinks] = useState(() =>
    (v.links.length ? v.links : [{ label: "", url: "" }]).map((l, i) => ({ ...l, key: i })),
  );
  const [nextKey, setNextKey] = useState(links.length);
  const errorCount =
    Object.keys(errors).filter((k) => k !== "form" && k !== "linkUrls").length +
    Object.keys(errors.linkUrls ?? {}).length;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      {errors.form || errorCount > 0 ? (
        <div role="alert" className="rounded-md border border-error p-3 text-sm">
          <p className="font-semibold text-error">
            {errors.form ?? `Couldn't save yet. Fix ${errorCount === 1 ? "the field" : `${errorCount} fields`} marked below.`}
          </p>
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 text-lg font-semibold">Who they are</legend>

        <Field id="name" label="Name" error={errors.name}>
          <input
            id="name"
            name="name"
            required
            defaultValue={v.name}
            autoComplete="off"
            className="field"
            {...invalid("name", errors.name)}
          />
        </Field>

        <ChoiceGroup legend="What is it?" error={errors.kind} errorId="kind-error">
          {KINDS.map((k) => (
            <Choice key={k} type="radio" name="kind" value={k} label={KIND_LABELS[k]} defaultChecked={v.kind === k} />
          ))}
        </ChoiceGroup>

        <ChoiceGroup legend="Type" hint="Pick at least one." error={errors.types} errorId="types-error">
          {TYPES.map((t) => (
            <Choice
              key={t}
              type="checkbox"
              name="types"
              value={t}
              label={TYPE_LABELS[t]}
              defaultChecked={v.types.includes(t)}
            />
          ))}
        </ChoiceGroup>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Where they&rsquo;re based</legend>
          <p id="place-hint" className="-mt-1 text-sm text-muted">
            Their home town, not where you met them.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="city" label="City or town" error={errors.city}>
              <input
                id="city"
                name="city"
                list="known-places"
                defaultValue={v.city}
                autoComplete="off"
                className="field"
                {...invalid("city", errors.city, "place-hint")}
              />
            </Field>
            <Field id="region" label="State or region">
              <input id="region" name="region" defaultValue={v.region} autoComplete="off" className="field" />
            </Field>
            <Field id="country" label="Country">
              <input id="country" name="country" defaultValue={v.country} autoComplete="off" className="field" />
            </Field>
          </div>
          <datalist id="known-places">
            {places.map((p) => (
              <option key={`${p.name}-${p.region}`} value={p.name}>
                {[p.name, p.region].filter(Boolean).join(", ")}
              </option>
            ))}
          </datalist>
        </fieldset>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 text-lg font-semibold">Your relationship</legend>

        <Field id="stage" label="Stage" error={errors.stage}>
          <select id="stage" name="stage" defaultValue={v.stage} className="field" {...invalid("stage", errors.stage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <ChoiceGroup legend="Reach out?" error={errors.reachOut} errorId="reachOut-error">
          <Choice type="radio" name="reach_out" value="" label="Not set" defaultChecked={v.reachOut === ""} />
          {REACH_OUTS.map((r) => (
            <Choice
              key={r}
              type="radio"
              name="reach_out"
              value={r}
              label={REACH_OUT_LABELS[r]}
              defaultChecked={v.reachOut === r}
            />
          ))}
        </ChoiceGroup>

        <ChoiceGroup legend="Why?" hint="Any that apply.">
          {REASONS.map((r) => (
            <Choice
              key={r}
              type="checkbox"
              name="reasons"
              value={r}
              label={REASON_LABELS[r]}
              defaultChecked={v.reasons.includes(r)}
            />
          ))}
        </ChoiceGroup>

        <Field id="fit_reason" label="Why they matter" hint="What you know or have heard. Not verified facts.">
          <textarea
            id="fit_reason"
            name="fit_reason"
            rows={3}
            defaultValue={v.fitReason}
            className="field"
            aria-describedby="fit_reason-hint"
          />
        </Field>

        <Field id="can_help_with" label="Can help with" hint="Separate with commas, like: music videos, DJ sets, gear.">
          <input
            id="can_help_with"
            name="can_help_with"
            defaultValue={v.canHelpWith}
            className="field"
            aria-describedby="can_help_with-hint"
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 text-lg font-semibold">Contact and links</legend>
        <p className="-mt-3 text-sm text-muted">All optional.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="email" label="Email" error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              defaultValue={v.email}
              autoComplete="off"
              className="field"
              {...invalid("email", errors.email)}
            />
          </Field>
          <Field id="phone" label="Phone">
            <input id="phone" name="phone" type="tel" defaultValue={v.phone} autoComplete="off" className="field" />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Links</legend>
          {links.map((link, i) => {
            const err = errors.linkUrls?.[i];
            return (
              <div key={link.key} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                <Field id={`link_label_${link.key}`} label={`Link ${i + 1} label`}>
                  <input
                    id={`link_label_${link.key}`}
                    name="link_label"
                    defaultValue={link.label}
                    placeholder="Bandcamp"
                    className="field"
                  />
                </Field>
                <Field id={`link_url_${link.key}`} label={`Link ${i + 1} URL`} error={err}>
                  <input
                    id={`link_url_${link.key}`}
                    name="link_url"
                    type="url"
                    inputMode="url"
                    defaultValue={link.url}
                    placeholder="yourband.bandcamp.com"
                    className="field"
                    {...invalid(`link_url_${link.key}`, err)}
                  />
                </Field>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setLinks((ls) => ls.filter((l) => l.key !== link.key))}
                  aria-label={`Remove link ${i + 1}`}
                >
                  Remove
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="button-secondary self-start"
            onClick={() => {
              setLinks((ls) => [...ls, { label: "", url: "", key: nextKey }]);
              setNextKey((k) => k + 1);
            }}
          >
            Add a link
          </button>
        </fieldset>

        <Field id="notes" label="Notes">
          <textarea id="notes" name="notes" rows={5} defaultValue={v.notes} className="field" />
        </Field>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="button-primary">
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="button-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function invalid(id: string, error?: string, extraDescribedBy?: string) {
  const describedBy = [error ? `${id}-error` : null, extraDescribedBy].filter(Boolean).join(" ");
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-error">
          Error: {error}
        </p>
      ) : null}
    </div>
  );
}

function ChoiceGroup({
  legend,
  hint,
  error,
  errorId,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset aria-describedby={error && errorId ? errorId : undefined} className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {hint ? <p className="-mt-1 text-sm text-muted">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">{children}</div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-error">
          Error: {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function Choice({
  type,
  name,
  value,
  label,
  defaultChecked,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="choice">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}
