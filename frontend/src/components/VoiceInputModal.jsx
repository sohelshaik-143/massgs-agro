import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, AlertCircle, Sparkles } from 'lucide-react';

export default function VoiceInputModal({ isOpen, onClose, onApplyParsedData }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [parsedData, setParsedData] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Click start and speak clearly (e.g. "I have 2 tonnes tomato in Guntur ready tomorrow")');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      setStatusMessage('Browser speech recognition is not supported in this browser. Please use text input fallback.');
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English + regional phonetic support

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Listening... Speak now.');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
        parseVoiceText(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusMessage(`Voice error: ${event.error}. You can type text directly below.`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setStatusMessage('Could not start microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusMessage('Voice recognition stopped.');
    }
  };

  const parseVoiceText = (text) => {
    const lower = text.toLowerCase();
    const result = {
      cropName: '',
      quantityKg: '',
      district: '',
      state: 'Andhra Pradesh',
      readyDate: new Date().toISOString().split('T')[0],
      qualityGrade: 'A'
    };

    // Crop extraction
    if (lower.includes('tomato') || lower.includes('tamatar')) result.cropName = 'Tomato';
    else if (lower.includes('onion') || lower.includes('pyaz') || lower.includes('ulli')) result.cropName = 'Onion';
    else if (lower.includes('chilli') || lower.includes('mirchi')) result.cropName = 'Chilli';
    else if (lower.includes('rice') || lower.includes('paddy') || lower.includes('dhan')) result.cropName = 'Rice';

    // Quantity extraction
    const tonneMatch = lower.match(/(\d+(\.\d+)?)\s*(tonne|ton|tons|tonnes)/i);
    const quintalMatch = lower.match(/(\d+(\.\d+)?)\s*(quintal|quintals|kattalu)/i);
    const kgMatch = lower.match(/(\d+(\.\d+)?)\s*(kg|kgs|kilos|kilogram|kilograms)/i);

    if (tonneMatch) {
      result.quantityKg = (parseFloat(tonneMatch[1]) * 1000).toString();
    } else if (quintalMatch) {
      result.quantityKg = (parseFloat(quintalMatch[1]) * 100).toString();
    } else if (kgMatch) {
      result.quantityKg = kgMatch[1];
    } else {
      const genericNum = lower.match(/(\d+(\.\d+)?)/);
      if (genericNum) result.quantityKg = (parseFloat(genericNum[1]) * 1000).toString();
    }

    // District extraction
    if (lower.includes('guntur')) { result.district = 'Guntur'; result.state = 'Andhra Pradesh'; }
    else if (lower.includes('chittoor') || lower.includes('madanapalle')) { result.district = 'Chittoor'; result.state = 'Andhra Pradesh'; }
    else if (lower.includes('kurnool')) { result.district = 'Kurnool'; result.state = 'Andhra Pradesh'; }
    else if (lower.includes('krishna') || lower.includes('vijayawada')) { result.district = 'Krishna'; result.state = 'Andhra Pradesh'; }
    else if (lower.includes('kolar')) { result.district = 'Kolar'; result.state = 'Karnataka'; }
    else if (lower.includes('hyderabad') || lower.includes('bowenpally')) { result.district = 'Hyderabad'; result.state = 'Telangana'; }
    else if (lower.includes('khammam')) { result.district = 'Khammam'; result.state = 'Telangana'; }
    else if (lower.includes('delhi') || lower.includes('azadpur')) { result.district = 'North Delhi'; result.state = 'Delhi'; }

    // Date extraction
    if (lower.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      result.readyDate = tomorrow.toISOString().split('T')[0];
    } else if (lower.includes('today')) {
      result.readyDate = new Date().toISOString().split('T')[0];
    }

    setParsedData(result);
  };

  const handleApply = () => {
    if (parsedData) {
      onApplyParsedData(parsedData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-earth-200">
        <div className="flex justify-between items-center pb-4 border-b border-earth-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-agri-100 flex items-center justify-center text-agri-700">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Voice Assistant Input</h3>
              <p className="text-xs text-slate-500">Natural speech extraction for farmer produce</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-6 text-center">
          <div className="relative inline-flex items-center justify-center">
            {isListening && (
              <span className="absolute w-24 h-24 rounded-full bg-agri-400/30 animate-ping"></span>
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition transform active:scale-95 ${
                isListening ? 'bg-amber-600 hover:bg-amber-700' : 'bg-agri-700 hover:bg-agri-800'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">{statusMessage}</p>
        </div>

        {/* Live Transcript Display */}
        <div className="bg-earth-50 rounded-xl p-3 border border-earth-200 mb-4 text-left">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Live Speech Transcript:
          </label>
          <p className="text-sm text-slate-800 italic min-h-[40px]">
            {transcript || 'No speech recorded yet...'}
          </p>
        </div>

        {/* Structured Field Preview */}
        {parsedData && (parsedData.cropName || parsedData.quantityKg || parsedData.district) && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 mb-4 text-left">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Extracted Produce Information:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Crop:</span> <strong className="text-slate-900">{parsedData.cropName || 'Not detected'}</strong></div>
              <div><span className="text-slate-500">Quantity:</span> <strong className="text-slate-900">{parsedData.quantityKg ? `${parsedData.quantityKg} kg` : 'Not detected'}</strong></div>
              <div><span className="text-slate-500">District:</span> <strong className="text-slate-900">{parsedData.district || 'Not detected'}</strong></div>
              <div><span className="text-slate-500">Ready Date:</span> <strong className="text-slate-900">{parsedData.readyDate}</strong></div>
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!parsedData || (!parsedData.cropName && !parsedData.quantityKg)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-agri-800 text-white text-sm font-semibold hover:bg-agri-700 disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Form</span>
          </button>
        </div>
      </div>
    </div>
  );
}
