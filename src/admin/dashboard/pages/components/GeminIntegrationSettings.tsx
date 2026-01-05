import { ArrowLeft } from 'lucide-react';
import geminiLogo from '../assets/geminiLogo.svg';
import ApiKeyInput from './ApiKeyInput';
import { ModernSelect } from '../../../../components';
import {Button} from '../../../../components';

import { useState } from '@wordpress/element';



const GeminiIntegrationSettings = ({ isSettingsMainPage,
    setIsSettingsMainPage
 }) => {
    const [selectedImageModel, setSelectedImageModel] = useState<string>("");
    const [selectedVideoModel, setSelectedVideoModel] = useState<string>("")


    return (
        <>        
        <div>
            <div className='border-b border-solid border-[#f0e5e5]'>
                <div className='inline-flex items-center gap-1.5 m-[22px]'
                onClick={
                    () => {
                        setIsSettingsMainPage(true)
                    }
                }
                >
                    <ArrowLeft 
                        className='w-4 h-4 rotate-0 opacity-100'
                    /> 
                    <div className="font-inter font-medium text-[14px] leading-[20px] tracking-normal text-center align-middle">
                        Back to Settings
                </div>
                </div>
            </div>
        </div>
            <div className='flex items-center justify-center my-[20px] sm:my-[100px]'>

                <div className='flex flex-col gap-[30px]'>
                    <div className='flex flex-col gap-[19px]'>
                        <div>
                            <img src={geminiLogo} />
                        </div>
                        <div>
                            <div className="font-['Inter'] font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[5px]">
                                Gemini Integration
                            </div>
                            <div className="text-sm text-gray-600 font-inter">
                            Connect your Gemini account with an API key. Need help finding your <a 
                            href="#" 
                            className="text-blue-600 underline hover:text-blue-700" >
                                API key
                            </a> ?
                            </div>
                        </div>
                    </div>
                    <ApiKeyInput />
                    <div>
                        <ModernSelect
                            value={selectedImageModel}
                            label="Select Image Model"
                            onChange={(val)=> {
                                console.log(val)
                                setSelectedImageModel(val)
                            }}
                            options={[
                                {label:"gemini-2.0-flash-exp", value:"gemini-2.0-flash-exp"},
                                {label:"gemini", value:"val2"},
                                {label:"label3", value: "val3"}
                            ]}
                            variant='list'
                        />
                    </div>
                    <div>
                        <ModernSelect
                                value={selectedVideoModel}
                                label="Select Video Model"
                                onChange={(val)=> {
                                    setSelectedVideoModel(val);
                                }}
                                options={[
                                    {label:"gemini-2.0-flash-exp", value:"val1"},
                                    {label:"gemini-2.0-flash-thinking-exp-1219", value:"val2"},
                                    {label:"gemini-2.0-flash", value: "val3"},
                                    {label:"gemini-1.5-flash", value:"val3"}
                                ]}
                                variant='list'
                        />
                    </div>

                </div>
            </div>

            <div className='flex gap-[10px] justify-end border-t border-solid border-[#f0e5e5] p-[22px]'>
                            <Button
                                className='py-3 px-7'
                            >
                                Connect
                            </Button>
                            <Button
                                className='py-3 px-7'
                                variant='outline'
                            >
                                Cancel
                            </Button>
            </div>
        </>
    )

}
export default GeminiIntegrationSettings;