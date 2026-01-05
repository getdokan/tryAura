import { __ } from '@wordpress/i18n';
import StateCardItem from './Components/StateCardItem';
import { Image, Video, Sparkles, Clock, Eye } from 'lucide-react';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

function Index() {
	const [ stats, setStats ] = useState( {
		image_count: 0,
		video_count: 0,
		tryon_count: 0,
		total_tokens: 0,
		video_seconds: 0,
	} );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		apiFetch( { path: '/try-aura/v1/stats' } )
			.then( ( data: any ) => {
				setStats( data );
				setLoading( false );
			} )
			.catch( () => setLoading( false ) );
	}, [] );

	return (
		<div>
			<h1 className="font-[600] text-[20px] leading-[28px] text-[rgba(51,51,51,0.8)]">
				{ __( 'Dashboard', 'try-aura' ) }
			</h1>

			<div className="mt-[16px] flex flex-row gap-[32px] flex-wrap">
				<StateCardItem
					title={ __( 'Images Generated', 'try-aura' ) }
					value={ stats.image_count }
					iconColor="#7047EB"
					Icon={ Image }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'Videos Generated', 'try-aura' ) }
					value={ stats.video_count }
					iconColor="#FF9345"
					Icon={ Video }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'Virtual Try-Ons', 'try-aura' ) }
					value={ stats.tryon_count.toLocaleString() }
					iconColor="#0ea5e9"
					Icon={ Eye }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'API Token Counts', 'try-aura' ) }
					value={ stats.total_tokens.toLocaleString() }
					iconColor="#47BF73"
					Icon={ Sparkles }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'Generated Video Duration', 'try-aura' ) }
					value={ stats.video_seconds.toFixed( 1 ) + 's' }
					iconColor="#f59e0b"
					Icon={ Clock }
					loading={ loading }
				/>
			</div>
		</div>
	);
}

export default Index;
