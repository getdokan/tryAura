import { Button } from '../../../components';
import { __ } from '@wordpress/i18n';

function ConfigFooter( { generatedUrl, doGenerate, isBusy, uploading, downloadName } ) {
	return (
		<div className="flex flex-row gap-[12px]">
			{ generatedUrl ? (
				<>
					<Button
						onClick={ doGenerate }
						disabled={ isBusy || uploading }
					>
						{ isBusy
							? __( 'Regenerating…', 'tryaura' )
							: __( 'Regenerate', 'tryaura' ) }
					</Button>

					<Button
						type="link"
						variant="outline"
						href={ isBusy ? undefined : generatedUrl }
						download={ isBusy ? undefined : downloadName }
						aria-disabled={ isBusy }
						style={ {
							pointerEvents: isBusy ? 'none' : 'auto',
							opacity: isBusy ? 0.6 : 1,
						} }
						disabled={ isBusy }
					>
						{ __( 'Download', 'try-aura' ) }
					</Button>
				</>
			) : (
				<Button onClick={ doGenerate } disabled={ isBusy || uploading }>
					{ isBusy
						? __( 'Generating…', 'try-aura' )
						: __( 'Generate', 'try-aura' ) }
				</Button>
			) }
		</div>
	);
}

export default ConfigFooter;
