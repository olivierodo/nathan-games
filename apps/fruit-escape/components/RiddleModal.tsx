
import React, { useState, useEffect, useRef } from 'react';
import { RiddleData } from '../types';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';

interface RiddleModalProps {
  type: 'MISSILE' | 'BOMB';
  riddle: RiddleData;
  preloadedAudio?: AudioBuffer;
  onSolve: (success: boolean) => void;
}

const RiddleModal: React.FC<RiddleModalProps> = ({ type, riddle, preloadedAudio, onSolve }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    handlePlayAudio();
    return () => {
      audioSourceRef.current?.stop();
    };
  }, []);

  const handlePlayAudio = () => {
    // Only play if preloaded audio is available from Gemini TTS
    if (preloadedAudio) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = preloadedAudio;
      source.connect(ctx.destination);
      source.start();
      audioSourceRef.current = source;
    }
  };

  const handleChoice = (choice: string) => {
    if (feedback) return;
    setSelected(choice);
    const isCorrect = choice === riddle.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    setTimeout(() => {
      onSolve(isCorrect);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white border-8 ${type === 'BOMB' ? 'border-stone-800' : 'border-rose-500'} rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-stone-800 uppercase tracking-tighter flex items-center gap-2">
            {type === 'MISSILE' ? '🚀 Tricky Trap!' : '☢️ Danger Alert!'}
          </h2>
          <button 
            onClick={handlePlayAudio}
            className={`p-3 rounded-full transition-colors shadow-sm ${preloadedAudio ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
            title={preloadedAudio ? 'Read Riddle' : 'Audio Unavailable'}
            disabled={!preloadedAudio}
          >
            <Volume2 size={24} />
          </button>
        </div>

        <div className="bg-emerald-50 p-8 rounded-3xl border-2 border-emerald-100 mb-8 shadow-inner">
          <p className="text-xl md:text-2xl font-bold text-emerald-900 text-center leading-relaxed italic">
            "{riddle.riddle}"
          </p>
        </div>

        <div className="grid gap-3">
          {riddle.options.map((option) => {
            const isCorrect = option === riddle.answer;
            const isSelected = option === selected;
            
            let btnClass = "bg-white border-4 border-emerald-100 text-emerald-800 hover:border-emerald-300 transition-all text-lg font-bold p-4 rounded-2xl shadow-sm text-left flex justify-between items-center";
            if (feedback) {
              if (isCorrect) btnClass = "bg-emerald-500 border-emerald-600 text-white p-4 rounded-2xl shadow-lg scale-105 z-10 transition-all font-bold text-lg flex items-center justify-between";
              else if (isSelected) btnClass = "bg-rose-500 border-rose-600 text-white p-4 rounded-2xl opacity-50 grayscale scale-95 transition-all font-bold text-lg flex items-center justify-between";
              else btnClass = "bg-white border-4 border-stone-100 text-stone-300 p-4 rounded-2xl opacity-30 grayscale transition-all text-lg";
            }

            return (
              <button
                key={option}
                disabled={!!feedback}
                onClick={() => handleChoice(option)}
                className={btnClass}
              >
                {option}
                {feedback && isCorrect && <CheckCircle2 size={20} />}
                {feedback && !isCorrect && isSelected && <XCircle size={20} />}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={`mt-6 p-4 rounded-2xl text-center animate-in fade-in slide-in-from-top-2 duration-500 ${feedback === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <p className="font-black uppercase text-sm mb-1">{feedback === 'correct' ? 'Hooray!' : 'Oh no!'}</p>
            <p className="text-xs font-bold leading-tight">{riddle.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiddleModal;
