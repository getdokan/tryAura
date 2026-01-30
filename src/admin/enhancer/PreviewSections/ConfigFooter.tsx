import { Button } from '../../../components';
import { __ } from '@wordpress/i18n';
import { hasPro } from '../../../utils/tryaura';

function ConfigFooter( {
	generatedUrl,
	doGenerate,
	isBusy,
	uploading,
	downloadName,
	isBlockEditorPage = false,
	optionalPrompt = '',
} ) {
	return (
		<div className="flex flex-row gap-[12px]">
			{ generatedUrl ? (
				<>
					<Button
						onClick={ doGenerate }
						disabled={ isBusy || uploading }
						loading={ isBusy }
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
						{ __( 'Download', 'tryaura' ) }
					</Button>
				</>
			) : (
				<Button
					onClick={ doGenerate }
					disabled={
						isBusy ||
						uploading ||
						( hasPro() &&
							isBlockEditorPage &&
							optionalPrompt.trim() === '' )
					}
					loading={ isBusy }
				>
					{ isBusy
						? __( 'Generating…', 'tryaura' )
						: __( 'Generate', 'tryaura' ) }
				</Button>
			) }
		</div>
	);
}

export default ConfigFooter;
