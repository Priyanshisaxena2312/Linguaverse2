import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioStreamer, float32ToInt16, arrayBufferToBase64 } from '@/lib/audio-engine';

export interface GeminiLiveOptions {
    topic?: string;
    mode: string;
    accent: string;
    voice?: string;
    formality?: 'formal' | 'informal';
    onTranscript?: (text: string, isFinal: boolean) => void;
    onAudioChunk?: (base64: string) => void;
    onError?: (error: string) => void;
}

export function useGeminiLive(options: GeminiLiveOptions) {
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const wsRef = useRef<WebSocket | null>(null);
    const audioStreamerRef = useRef<AudioStreamer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const volumeIntervalRef = useRef<number | null>(null);

    const [volume, setVolume] = useState(0);

    const stopMic = useCallback(() => {
        processorRef.current?.disconnect();
        audioContextRef.current?.close();
        processorRef.current = null;
        audioContextRef.current = null;
    }, []);

    const startMic = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                if (!audioStreamerRef.current) {
                    setVolume(rms * 5);
                }

                const pcmData = float32ToInt16(inputData);
                const base64 = arrayBufferToBase64(pcmData.buffer as ArrayBuffer);

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        realtime_input: {
                            audio: {
                                data: base64,
                                mime_type: "audio/pcm;rate=16000"
                            }
                        }
                    }));
                }
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
        } catch (err) {
            console.error('Mic error:', err);
            options.onError?.('Could not access microphone.');
        }
    }, [options]);

    const sendText = useCallback((text: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                realtime_input: {
                    text: text
                }
            }));
            return true;
        }
        return false;
    }, []);

    const disconnect = useCallback(() => {
        stopMic();
        wsRef.current?.close();
        if (audioStreamerRef.current) {
            audioStreamerRef.current.stop();
            audioStreamerRef.current = null;
        }
        if (volumeIntervalRef.current) cancelAnimationFrame(volumeIntervalRef.current);
        setVolume(0);
        setConnected(false);
        setStatus('idle');
    }, [stopMic]);

    const connect = useCallback(() => {
        setStatus('connecting');
        const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || 'ws://localhost:3001';
        const ws = new WebSocket(proxyUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            const setupMessage = {
                setup: {
                    model: "gemini-live-2.5-flash-native-audio",
                    generation_config: {
                        response_modalities: ["audio"],
                        speech_config: {
                            voice_config: {
                                prebuilt_voice_config: {
                                    voice_name: options.voice || 'Callirrhoe'
                                }
                            }
                        },
                    },
                    system_instruction: {
                        parts: [{
                            text: `You are a high-end Senior Language Teacher and professional pronunciation coach. 
                            Current Session Mode: ${options.mode}
                            Topic: ${options.topic || 'Random Conversation'}
                            Tone: ${options.formality === 'formal' ? "Strict, professional, academic, and highly proper." : "Friendly, conversational, relaxed, and encouraging."}
                            
                            **CRITICAL TURN-TAKING RULE:**
                            - DO NOT interrupt the student. Wait for the user to completely finish their thought.
                            - Ignore brief pauses. Only reply when there is a clear, definitive end to the user's turn.
                            
                            **CRITICAL ACCENT ENFORCEMENT:**
                            - You MUST speak with a thick, authentic, and consistent ${options.accent} accent.
                            - This is your native identity. DO NOT switch to any other accent.
                            - If set to Indian, you MUST use Standard Indian English: syllable-timed rhythm, retroflex T and D sounds.
                            
                            - Maintain the requested ${options.formality || 'informal'} tone throughout the session.`
                        }]
                    }
                }
            };
            ws.send(JSON.stringify(setupMessage));
        };

        ws.onmessage = async (event) => {
            try {
                let text = '';
                if (event.data instanceof Blob) {
                    text = await event.data.text();
                } else {
                    text = event.data;
                }

                const data = JSON.parse(text);

                if (data.setupComplete) {
                    setStatus('connected');
                    setConnected(true);
                    startMic();
                    setTimeout(() => {
                        sendText("Hello! Please start the conversation by introducing yourself as my teacher and asking me a question to get started.");
                    }, 500);
                }

                if (data.serverContent) {
                    const parts = data.serverContent.modelTurn?.parts || [];
                    for (const part of parts) {
                        if (part.inlineData) {
                            if (!audioStreamerRef.current) {
                                audioStreamerRef.current = new AudioStreamer(24000);
                            }
                            audioStreamerRef.current.addBase64Chunk(part.inlineData.data);
                            options.onAudioChunk?.(part.inlineData.data);
                        }
                        if (part.text) {
                            options.onTranscript?.(part.text, true);
                        }
                    }
                }
            } catch (e) {
                console.error("WS message error:", e);
            }
        };

        ws.onclose = () => {
            setConnected(false);
            setStatus('idle');
            if (status === 'connected') {
                options.onError?.('Connection to AI server lost.');
            }
        };

        ws.onerror = (e) => {
            setStatus('error');
            options.onError?.('Failed to connect to proxy server.');
        };
    }, [options, startMic, sendText, status]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    useEffect(() => {
        const checkVolume = () => {
            if (audioStreamerRef.current) {
                const vol = audioStreamerRef.current.getVolume();
                setVolume(vol / 255);
            }
            volumeIntervalRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
        return () => {
            if (volumeIntervalRef.current) cancelAnimationFrame(volumeIntervalRef.current);
        };
    }, []);

    return { connected, status, connect, disconnect, startMic, stopMic, sendText, volume };
}
