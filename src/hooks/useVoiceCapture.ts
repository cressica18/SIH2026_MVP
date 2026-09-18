import { useState, useCallback } from 'react';
import { Language } from '../types';

export function useVoiceCapture(
  currentLanguage: Language,
  onResult: (transcript: string) => void,
  onError?: (error: any) => void
) {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(() => {
    if (isRecording) return;
    
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulated speech for browsers without Web Speech API support
      setIsRecording(true);
      setTimeout(() => {
        const simulatedSpoken =
          currentLanguage === 'hi'
            ? 'दो क्विंटल टमाटर, अठारह रुपये किलो'
            : currentLanguage === 'mr'
            ? 'दोन क्विंटल टोमॅटो, वीस रुपये किलो'
            : currentLanguage === 'pa'
            ? 'ਪੰਜਾਹ ਕੁਇੰਟਲ ਆਲੂ, ਚੌਦਾਂ ਰੁਪਏ ਕਿਲੋ'
            : currentLanguage === 'te'
            ? 'రెండు క్వింటాళ్ల టమోటా, కిలో పద్దెనిమిది రూపాయలు'
            : '2 quintal tomato, expecting 18 rupees per kg';

        setIsRecording(false);
        onResult(simulatedSpoken);
      }, 1500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      const langMap: Record<Language, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        te: 'te-IN',
        pa: 'pa-IN',
      };
      recognition.lang = langMap[currentLanguage] || 'en-IN';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        onResult(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      setIsRecording(false);
      if (onError) onError(err);
    }
  }, [currentLanguage, onResult, onError, isRecording]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording };
}
