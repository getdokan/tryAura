import { ArrowLeft } from 'lucide-react';
import geminiLogo from '../assets/geminiLogo.svg';
import ApiKeyInput from './ApiKeyInput';
import { ModernSelect } from '../../../../components';

const GeminiIntegrationSettings = ({ isSettingsMainPage,
    setIsSettingsMainPage
 }) => {

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

                <div>
                    <div className='flex flex-col gap-[19px]'>
                        <div>
                            <img src={geminiLogo} />

                        </div>
                        <div>
                            <div className="font-['Inter'] font-semibold text-[20px] leading-[28px] tracking-normal align-middle">
                                Gemini Integration
                            </div>
                            <div className="font-['Inter'] font-normal text-[14px] leading-[18.67px] tracking-[0px]">
                            Connect your Gemini account with an API key. Need help finding your API key?
                            </div>

                        </div>
                    </div>
                    <ApiKeyInput />
                    <div className='flex flex-col gap-[12px]'>
                        <ModernSelect
                            value="value1"
                            label="Select Image Model"
                            onChange={(val)=> {
                                console.log(val)
                            }}
                            options={[
                                {label:"gemini-2.0-flash-exp", value:"gemini-2.0-flash-exp"},
                                {label:"gemini", value:"val2"},
                                {label:"label3", value: "val3"}
                            ]}
                            placeholder='placeholder'
                            variant='list'
                        />
                    </div>
                    <div>
                    <ModernSelect
                            value="value1"
                            label="Select Video Model"
                            onChange={(val)=> {
                                console.log(val)
                            }}
                            options={[
                                {label:"label1", value:"val1"},
                                {label:"label2", value:"val2"},
                                {label:"label3", value: "val3"}
                            ]}
                            variant='list'
                        />
                    </div>

                </div>
            </div>

            <div className='flex gap-[10px] justify-end border-t border-solid border-[#f0e5e5] p-[22px]'>

                <button 
                    className='flex items-center justify-center w-[115px] h-[40px] pt-[10px] pb-[10px] pl-[24px] pr-[24px] gap-[10px] rounded-[5px] bg-[#7c4dff] hover:bg-[#6b3de6] text-white text-sm font-medium opacity-100 transition-colors duration-200'
                >Connect</button>
                <button 
                    className='flex items-center justify-center w-[115px] h-[40px] pt-[10px] pb-[10px] pl-[24px] pr-[24px] gap-[10px] rounded-[5px] bg-[#7c4dff] hover:bg-[#6b3de6] text-white text-sm font-medium opacity-100 transition-colors duration-200'
                >Cancel</button>


            </div>
        </>
    )

}
export default GeminiIntegrationSettings;