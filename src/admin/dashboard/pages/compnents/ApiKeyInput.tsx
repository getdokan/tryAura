import { useState } from 'react';

export default function ApiKeyInput() {
  const [apiKey, setApiKey] = useState('');
  const [isHidden, setIsHidden] = useState(true);

  return (
    <div className="flex flex-col w-full">
      {/* Label */}
      <label className="font-inter font-medium text-[14px] leading-[150%] tracking-normal align-middle">
        Gemini API KEY
      </label>

      {/* Input + Toggle */}
      <div className="relative">
        <input
          type={isHidden ? 'password' : 'text'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          className="w-full pr-16 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Show/Hide button */}
        <button
          type="button"
          onClick={() => setIsHidden(!isHidden)}
          className="absolute inset-y-0 right-0 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {isHidden ? 'Show' : 'Hide'}
        </button>
      </div>
        <p>Paste the API key provided by Gemini.</p>
    </div>
  );
}
