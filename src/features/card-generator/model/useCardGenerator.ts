'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { requestStoredCard, requestStoredCardCreation, requestYouTubeMetadata } from '../api/card-generator.client';
import { buildMarkdown, buildStoredCardMarkdown } from '../lib/markdown';
import { getStorageFailureCount, shouldUseCompatibilityFallback } from './card-generator-snapshot';
import {
  CARD_RESTORE_ERROR_MESSAGES,
  CARD_STORAGE_ERROR_MESSAGES,
  FALLBACK_ERROR_MESSAGE,
  getCardRestoreErrorMessage,
  getCardStorageErrorMessage,
  getMetadataErrorMessage,
  METADATA_ERROR_MESSAGES,
} from './card-generator-errors';
import {
  createSvgCardParams,
  DEFAULT_THEME,
  isSvgVideoId,
  parseSvgCardData,
  parseYouTubeId,
  suggestArtist,
  suggestTitle,
  type CardMeta,
  type CardStyleId,
  type CardTheme,
  type CoverPosition,
  type Track,
} from '@/entities/music-card';
import { captureMonitoringError } from '@/shared/lib/sentry-monitoring';

type Status = 'idle' | 'loading' | 'ready' | 'error';
type SaveStatus = 'idle' | 'saving' | 'error';
type LoadingKind = 'metadata' | 'stored-card' | null;
interface RestoredCard {
  id: string;
  snapshot: string;
}

const INITIAL_META: CardMeta = { title: '', artist: '' };
const INITIAL_COVER_POSITION: CoverPosition = { x: 50, y: 50, scale: 100, aspectRatio: 16 / 9 };
const CARD_ORIGIN = 'https://github-readme-music.vercel.app';
interface UseCardGeneratorOptions {
  onStoredCardCreated?: (cardId: string) => void;
}

export const useCardGenerator = ({ onStoredCardCreated }: UseCardGeneratorOptions = {}) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [loadingKind, setLoadingKind] = useState<LoadingKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [meta, setMeta] = useState<CardMeta>(INITIAL_META);
  const [style, setStyle] = useState<CardStyleId>('player');
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [restoredCard, setRestoredCard] = useState<RestoredCard | null>(null);
  const [markdownKind, setMarkdownKind] = useState<'stored' | 'fallback' | null>(null);
  const [failedSnapshot, setFailedSnapshot] = useState<string | null>(null);
  const [storageFailureCount, setStorageFailureCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'success' | 'error' | null>(null);
  const [, startTransition] = useTransition();
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const copyFeedbackTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      if (copyFeedbackTimerRef.current) window.clearTimeout(copyFeedbackTimerRef.current);
    },
    [],
  );

  const currentSnapshot = useMemo(() => {
    if (!track) return '';
    return createSvgCardParams(track, style, meta, theme, progressSeconds).toString();
  }, [meta, progressSeconds, style, theme, track]);
  const hasPendingMarkdownChanges = Boolean(generatedMarkdown && savedSnapshot !== currentSnapshot);
  const isFallbackMarkdown = markdownKind === 'fallback' && savedSnapshot === currentSnapshot;

  const updateUrl = (value: string) => {
    setUrl(value);
    if (error) {
      setError(null);
      setStatus('idle');
    }
  };

  const generate = async () => {
    if (!parseYouTubeId(url)) {
      setError(METADATA_ERROR_MESSAGES.INVALID_URL);
      setStatus('error');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setError(null);
    setCopyFeedback(null);
    setLoadingKind('metadata');
    setStatus('loading');
    setCopied(false);
    let receivedResponse = false;

    try {
      const { response, body } = await requestYouTubeMetadata(url, controller.signal);
      receivedResponse = true;

      if (!body || (response.ok && !body.data)) {
        captureMonitoringError({
          message: '영상 정보 응답을 처리할 수 없습니다',
          errorCode: 'client_metadata_invalid_response',
          operation: 'youtube_metadata',
          layer: 'client',
          httpStatus: response.status,
        });
        throw new Error(FALLBACK_ERROR_MESSAGE);
      }

      if (!response.ok || !body.data) throw new Error(getMetadataErrorMessage(body.error?.code));
      if (requestId !== requestIdRef.current) return;

      const nextTrack: Track = {
        source: 'youtube',
        ...body.data,
        coverPosition: INITIAL_COVER_POSITION,
        waveform: createWaveform(body.data.videoId),
      };

      startTransition(() => {
        setTrack(nextTrack);
        setGeneratedMarkdown(null);
        setSavedSnapshot(null);
        setRestoredCard(null);
        setMarkdownKind(null);
        setFailedSnapshot(null);
        setStorageFailureCount(0);
        setSaveStatus('idle');
        setSaveError(null);
        setLoadingKind(null);
        setProgressSeconds(0);
        setMeta({
          title: limitMetaText(suggestTitle(nextTrack.title)),
          artist: limitMetaText(suggestArtist(nextTrack.channel, nextTrack.title)),
        });
        setStatus('ready');
      });
    } catch (requestError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      if (!receivedResponse) {
        captureMonitoringError({
          message: '영상 정보를 불러오는 네트워크 요청에 실패했습니다',
          errorCode: 'client_metadata_network_failed',
          operation: 'youtube_metadata',
          layer: 'client',
        });
      }
      setError(
        !receivedResponse
          ? FALLBACK_ERROR_MESSAGE
          : requestError instanceof Error
            ? requestError.message
            : FALLBACK_ERROR_MESSAGE,
      );
      setLoadingKind(null);
      setStatus('error');
    }
  };

  const updateCoverPosition = (coverPosition: CoverPosition) => {
    resetStorageFailures();
    setTrack((currentTrack) => (currentTrack ? { ...currentTrack, coverPosition } : currentTrack));
  };

  const updateMeta = (nextMeta: CardMeta) => {
    resetStorageFailures();
    setMeta(nextMeta);
  };

  const updateStyle = (nextStyle: CardStyleId) => {
    resetStorageFailures();
    setStyle(nextStyle);
  };

  const updateProgressSeconds = (nextProgressSeconds: number) => {
    resetStorageFailures();
    setProgressSeconds(nextProgressSeconds);
  };

  const updateTheme = (nextTheme: CardTheme) => {
    resetStorageFailures();
    setTheme(nextTheme);
  };

  const resetStorageFailures = () => {
    setFailedSnapshot(null);
    setStorageFailureCount(0);
  };

  const restoreStoredCard = async (cardId: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setError(null);
    setTrack(null);
    setGeneratedMarkdown(null);
    setSavedSnapshot(null);
    setRestoredCard(null);
    setMarkdownKind(null);
    setFailedSnapshot(null);
    setStorageFailureCount(0);
    setSaveStatus('idle');
    setSaveError(null);
    setCopied(false);
    setCopyFeedback(null);
    setLoadingKind('stored-card');
    setStatus('loading');
    let receivedResponse = false;

    try {
      const { response, body } = await requestStoredCard(cardId, controller.signal);
      receivedResponse = true;
      const responseData = body?.data;

      if (!body || (response.ok && !isStoredCardResponseData(responseData))) {
        captureMonitoringError({
          message: '저장된 카드 설정 응답을 처리할 수 없습니다',
          errorCode: 'client_card_restore_invalid_response',
          operation: 'stored_card_restore',
          layer: 'client',
          httpStatus: response.status,
        });
        throw new Error(CARD_RESTORE_ERROR_MESSAGES.CARD_READ_UNAVAILABLE);
      }

      if (!response.ok || !isStoredCardResponseData(responseData)) {
        throw new Error(getCardRestoreErrorMessage(body?.error?.code));
      }
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;

      const card = parseSvgCardData(new URLSearchParams(responseData.params));
      const restoredTrack: Track = {
        source: 'stored',
        videoId: responseData.videoId,
        title: card.title,
        channel: card.artist,
        duration: card.duration,
        cover: card.cover,
        coverPosition: card.coverPosition,
        waveform: card.waveform,
      };
      const restoredSnapshot = createSvgCardParams(
        restoredTrack,
        card.style,
        { title: card.title, artist: card.artist },
        card.theme,
        card.progressSeconds,
      ).toString();

      startTransition(() => {
        setUrl(`https://www.youtube.com/watch?v=${restoredTrack.videoId}`);
        setTrack(restoredTrack);
        setMeta({ title: card.title, artist: card.artist });
        setStyle(card.style);
        setTheme(card.theme);
        setProgressSeconds(card.progressSeconds);
        setRestoredCard({ id: cardId, snapshot: restoredSnapshot });
        setLoadingKind(null);
        setStatus('ready');
      });
    } catch (requestError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      if (!receivedResponse) {
        captureMonitoringError({
          message: '저장된 카드 설정을 불러오는 네트워크 요청에 실패했습니다',
          errorCode: 'client_card_restore_network_failed',
          operation: 'stored_card_restore',
          layer: 'client',
        });
      }
      setError(
        !receivedResponse
          ? CARD_RESTORE_ERROR_MESSAGES.CARD_READ_UNAVAILABLE
          : requestError instanceof Error
            ? requestError.message
            : CARD_RESTORE_ERROR_MESSAGES.CARD_READ_UNAVAILABLE,
      );
      setLoadingKind(null);
      // Keep the recent-card landing view visible so a transient restore failure can be retried immediately.
      setStatus('idle');
    }
  };

  const generateMarkdown = async () => {
    if (!track || saveStatus === 'saving') return;

    const snapshot = createSvgCardParams(track, style, meta, theme, progressSeconds);
    const snapshotKey = snapshot.toString();
    if (generatedMarkdown && savedSnapshot === snapshotKey && markdownKind === 'stored') return;

    if (restoredCard?.snapshot === snapshotKey) {
      setGeneratedMarkdown(buildStoredCardMarkdown(track, style, meta, progressSeconds, restoredCard.id, CARD_ORIGIN));
      onStoredCardCreated?.(restoredCard.id);
      setSavedSnapshot(snapshotKey);
      setMarkdownKind('stored');
      setFailedSnapshot(null);
      setStorageFailureCount(0);
      setSaveStatus('idle');
      setSaveError(null);
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);
    setCopied(false);
    setCopyFeedback(null);

    let receivedResponse = false;
    let canUseCompatibilityFallback = false;
    try {
      const { response, body } = await requestStoredCardCreation(track.videoId, Object.fromEntries(snapshot));
      receivedResponse = true;
      const cardId = body?.data?.id;

      if (!body || (response.ok && !cardId)) {
        canUseCompatibilityFallback = true;
        captureMonitoringError({
          message: '카드 저장 응답을 처리할 수 없습니다',
          errorCode: 'client_card_storage_invalid_response',
          operation: 'card_create',
          layer: 'client',
          httpStatus: response.status,
        });
        throw new Error(CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE);
      }

      if (!response.ok || !cardId) {
        canUseCompatibilityFallback = body.error?.code === 'CARD_STORAGE_UNAVAILABLE';
        throw new Error(getCardStorageErrorMessage(body.error?.code));
      }

      setGeneratedMarkdown(buildStoredCardMarkdown(track, style, meta, progressSeconds, cardId, CARD_ORIGIN));
      onStoredCardCreated?.(cardId);
      setSavedSnapshot(snapshotKey);
      setMarkdownKind('stored');
      setFailedSnapshot(null);
      setStorageFailureCount(0);
      setSaveStatus('idle');
    } catch (requestError) {
      if (!receivedResponse) {
        canUseCompatibilityFallback = true;
        captureMonitoringError({
          message: '카드 저장 네트워크 요청에 실패했습니다',
          errorCode: 'client_card_storage_network_failed',
          operation: 'card_create',
          layer: 'client',
        });
      }

      const errorMessage = !receivedResponse
        ? CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE
        : requestError instanceof Error
          ? requestError.message
          : CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE;

      if (!canUseCompatibilityFallback) {
        setFailedSnapshot(null);
        setStorageFailureCount(0);
        setSaveError(errorMessage);
        setSaveStatus('error');
        return;
      }

      const nextFailureCount = getStorageFailureCount(failedSnapshot, storageFailureCount, snapshotKey);
      setFailedSnapshot(snapshotKey);
      setStorageFailureCount(nextFailureCount);

      if (shouldUseCompatibilityFallback(nextFailureCount)) {
        setGeneratedMarkdown(buildMarkdown(track, style, meta, theme, progressSeconds, CARD_ORIGIN));
        setSavedSnapshot(snapshotKey);
        setMarkdownKind('fallback');
        setSaveError(null);
        setSaveStatus('idle');
        return;
      }

      setSaveError(errorMessage);
      setSaveStatus('error');
    }
  };

  const copyMarkdown = async () => {
    if (!generatedMarkdown) return;

    try {
      await navigator.clipboard.writeText(generatedMarkdown);
      setCopied(true);
      showCopyFeedback('success');
    } catch {
      showCopyFeedback('error');
    }
  };

  const showCopyFeedback = (feedback: 'success' | 'error') => {
    if (copyFeedbackTimerRef.current) window.clearTimeout(copyFeedbackTimerRef.current);
    setCopyFeedback(feedback);
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      setCopyFeedback(null);
      copyFeedbackTimerRef.current = null;
    }, 1800);
  };

  return {
    url,
    status,
    loadingKind,
    error,
    track,
    meta,
    style,
    progressSeconds,
    theme,
    copied,
    copyFeedback,
    markdown: generatedMarkdown,
    hasPendingMarkdownChanges,
    saveStatus,
    saveError,
    isFallbackMarkdown,
    setMeta: updateMeta,
    setStyle: updateStyle,
    setProgressSeconds: updateProgressSeconds,
    setTheme: updateTheme,
    updateUrl,
    generate,
    restoreStoredCard,
    updateCoverPosition,
    generateMarkdown,
    copyMarkdown,
  };
};

const isStringRecord = (value: unknown): value is Record<string, string> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
};

const isStoredCardResponseData = (value: unknown): value is { videoId: string; params: Record<string, string> } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'videoId' in value &&
    'params' in value &&
    typeof value.videoId === 'string' &&
    isSvgVideoId(value.videoId) &&
    isStringRecord(value.params)
  );
};

const createWaveform = (videoId: string) => {
  let seed = [...videoId].reduce((total, character) => total + character.charCodeAt(0), 0);
  return Array.from({ length: 20 }, () => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff;
    return 18 + (seed % 63);
  });
};

const limitMetaText = (value: string) => {
  return value.slice(0, 120);
};
