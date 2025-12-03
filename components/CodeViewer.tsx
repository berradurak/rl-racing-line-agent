import React from 'react';
import { PYTHON_ENV_CODE, PYTHON_TRAIN_CODE } from '../services/pythonCode';
import { Copy } from 'lucide-react';

export const CodeViewer: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Code copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-mono text-blue-400 font-bold">racing_env.py</h3>
            <button onClick={() => copyToClipboard(PYTHON_ENV_CODE)} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
                <Copy size={14} /> Copy
            </button>
        </div>
        <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto bg-[#0d1117]">
            <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                {PYTHON_ENV_CODE}
            </pre>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-mono text-green-400 font-bold">train_dqn_agent.py</h3>
            <button onClick={() => copyToClipboard(PYTHON_TRAIN_CODE)} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
                <Copy size={14} /> Copy
            </button>
        </div>
        <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto bg-[#0d1117]">
            <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                {PYTHON_TRAIN_CODE}
            </pre>
        </div>
      </div>
    </div>
  );
};