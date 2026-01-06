import { useState } from 'react';

export default function ApiKeyInput({apiKey, setApiKey}) {
  const [isHidden, setIsHidden] = useState(true);

  

  return (
    <div className="flex flex-col w-full">
      {/* Label */}
      <label className="font-medium text-[14px] leading-[150%] tracking-normal align-middle">
        Gemini API KEY
      </label>

      {/* Input + Toggle */}
      <div className="relative">
        <input
          type={isHidden ? 'password' : 'text'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          className="w-full pr-16 border border-gray-300 rounded-md px-3 py-2"
        />

        {/* Show/Hide button */}
        <button
          type="button"
          onClick={() => setIsHidden(!isHidden)}
          className="absolute inset-y-0 right-0 px-3 py-2 text-sm font-medium"
        >
          {isHidden ? 'Show' : 'Hide'}
        </button>
      </div>
        <p className='text-sm text-gray-600'>Paste the API key provided by Gemini.</p>
    </div>
  );
}
