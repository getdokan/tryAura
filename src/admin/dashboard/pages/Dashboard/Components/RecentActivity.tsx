import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { Image, Video, Eye } from 'lucide-react';

const tabs = [
	{ id: '', label: __( 'All', 'try-aura' ) },
	{ id: 'image', label: __( 'A.I. Images', 'try-aura' ) },
	{ id: 'video', label: __( 'A.I. Videos', 'try-aura' ) },
	{ id: 'tryon', label: __( 'Try Ons', 'try-aura' ) },
];

function RecentActivity() {
	const [ activeTab, setActiveTab ] = useState( '' );
	const [ activities, setActivities ] = useState( [] );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		setLoading( true );
		apiFetch( {
			path: addQueryArgs( '/try-aura/v1/activities', {
				type: activeTab,
				limit: 5,
			} ),
		} )
			.then( ( data: any ) => {
				setActivities( data as any[] );
				setLoading( false );
			} )
			.catch( () => setLoading( false ) );
	}, [ activeTab ] );

	const getIcon = ( activity: any ) => {
		if ( activity.generated_from === 'tryon' ) {
			return <Eye size={ 20 } className="text-[#0ea5e9]" />;
		}
		if ( activity.type === 'video' ) {
			return <Video size={ 20 } className="text-[#FF9345]" />;
		}
		return <Image size={ 20 } className="text-[#7047EB]" />;
	};

	const getIconBg = ( activity: any ) => {
		if ( activity.generated_from === 'tryon' ) {
			return 'bg-[#0ea5e91a]';
		}
		if ( activity.type === 'video' ) {
			return 'bg-[#FF93451a]';
		}
		return 'bg-[#7047EB1a]';
	};

	const getActivityText = ( activity: any ) => {
		const objectName = activity.object_name
			? ` '${ activity.object_name }'`
			: '';
		if ( activity.generated_from === 'tryon' ) {
			return __( 'Customer virtually tried on', 'try-aura' ) + objectName;
		}
		if ( activity.type === 'video' ) {
			return __( 'New video created for', 'try-aura' ) + objectName;
		}
		return __( 'A.I. image generated for', 'try-aura' ) + objectName;
	};

	return (
		<div className="bg-white rounded-[16px] border border-[rgba(230,230,230,1)] p-[24px] h-full w-full">
			<div className="flex flex-row flex-wrap justify-between gap-[24px] mb-[24px]">
				<h2 className="text-[18px] font-[600] text-[rgba(51,51,51,1)] m-0">
					{ __( 'Recent Activity', 'try-aura' ) }
				</h2>
				<div className="flex flex-row gap-[8px]">
					{ tabs.map( ( tab ) => (
						<button
							key={ tab.id }
							onClick={ () => setActiveTab( tab.id ) }
							className={ `px-[16px] py-[6px] rounded-[8px] text-[14px] font-[500] transition-colors ${
								activeTab === tab.id
									? 'bg-[#7047EB] text-white'
									: 'bg-[#F5F5F5] text-[rgba(99,99,99,1)] hover:bg-[#E5E5E5]'
							}` }
						>
							{ tab.label }
						</button>
					) ) }
				</div>
			</div>

			<div className="flex flex-col gap-[20px]">
				{ loading && (
					<div className="animate-pulse flex flex-col gap-[20px]">
						{ [ 1, 2, 3, 4, 5 ].map( ( i ) => (
							<div key={ i } className="flex flex-row gap-[16px]">
								<div className="w-[40px] h-[40px] rounded-[8px] bg-neutral-200"></div>
								<div className="flex flex-col gap-[8px] flex-1">
									<div className="h-4 bg-neutral-200 rounded w-3/4"></div>
									<div className="h-3 bg-neutral-200 rounded w-1/4"></div>
								</div>
							</div>
						) ) }
					</div>
				) }

				{ ! loading && activities.length > 0 && (
					<div className="flex flex-col gap-[20px]">
						{ activities.map( ( activity: any ) => (
							<div
								key={ activity.id }
								className="flex flex-row gap-[16px]"
							>
								<div
									className={ `w-[40px] h-[40px] rounded-[8px] flex items-center justify-center ${ getIconBg(
										activity
									) }` }
								>
									{ getIcon( activity ) }
								</div>
								<div className="flex flex-col">
									<span className="text-[14px] font-[500] text-[rgba(51,51,51,1)]">
										{ getActivityText( activity ) }
									</span>
									<span className="text-[12px] text-[rgba(153,153,153,1)]">
										{ activity.human_time_diff }
									</span>
								</div>
							</div>
						) ) }
					</div>
				) }

				{ ! loading && activities.length === 0 && (
					<div className="text-center py-[20px] text-[rgba(153,153,153,1)]">
						{ __( 'No recent activity found.', 'try-aura' ) }
					</div>
				) }
			</div>
		</div>
	);
}

export default RecentActivity;
