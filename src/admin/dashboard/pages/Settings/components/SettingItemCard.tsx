import { Button } from '../../../../../components';
import { useNavigate } from 'react-router-dom';

function SettingsItemCard( {
	icon,
	title,
	badge,
	subTitle,
	link,
	linkText,
	loading = false,
}: {
	icon: JSX.Element;
	title: string;
	badge: JSX.Element;
	subTitle: string;
	link: string;
	linkText: string;
	loading?: boolean;
} ) {
	const navigate = useNavigate();

	if ( loading ) {
		return (
			<div className="flex justify-between flex-wrap bg-[#FFFFFF] border-2 border-[#FFFFFF] p-[24px] rounded-[16px] animate-pulse">
				<div className="flex">
					<div className="mr-3.5 w-15.75 h-15.5 bg-neutral-200 text-neutral-200 rounded-2xl"></div>
					<div className="flex flex-col justify-center">
						<div className="flex mb-2.5 items-center">
							<div className="font-semibold text-[16px] leading-5.5 bg-neutral-200 text-neutral-200 animate-pulse">
								LoremLoremLoremLoremLoremLoremLorem
							</div>
							<div className="ml-3 bg-neutral-200 text-neutral-200">
								lorem
							</div>
						</div>

						<div className="font-normal text-[14px] leading-4.5 bg-neutral-200 text-neutral-200">
							lorem7
						</div>
					</div>
				</div>
				<div className="flex items-center">
					<Button
						className="py-3 px-7 bg-neutral-200 text-neutral-200"
						disabled={ true }
					>
						lorem
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex justify-between flex-wrap bg-[#FFFFFF] border-2 border-[#FFFFFF] p-[24px] rounded-[16px]">
			<div className="flex">
				<div className="mr-3.5">{ icon }</div>
				<div className="flex flex-col justify-center">
					<div className="flex mb-2.5 items-center">
						<div className="font-semibold text-[16px] leading-5.5 text-[rgba(37,37,45,1)]">
							{ title }
						</div>
						<div className="ml-3">{ badge }</div>
					</div>

					<div className="font-normal text-[14px] leading-4.5 text-[rgba(99,99,99,1)]">
						{ subTitle }
					</div>
				</div>
			</div>
			<div className="flex items-center">
				<Button
					className="py-3 px-7"
					onClick={ () => {
						navigate( link );
					} }
				>
					{ linkText }
				</Button>
			</div>
		</div>
	);
}

export default SettingsItemCard;
