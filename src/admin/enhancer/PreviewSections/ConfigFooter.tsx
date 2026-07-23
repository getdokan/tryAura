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
	// #33: an apparel mode is itself a directive, so it satisfies the
	// block-editor prompt requirement without any typed text.
	bypassPromptRequirement = false,
	// #32: the Edit tab relabels the action ("Apply edit" / "Re-apply").
	primaryLabel = __( 'Generate', 'tryaura' ),
	primaryBusyLabel = __( 'Generating…', 'tryaura' ),
	regenerateLabel = __( 'Regenerate', 'tryaura' ),
	regenerateBusyLabel = __( 'Regenerating…', 'tryaura' ),
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
						{ isBusy ? regenerateBusyLabel : regenerateLabel }
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
							optionalPrompt.trim() === '' &&
							! bypassPromptRequirement )
					}
					loading={ isBusy }
				>
					{ isBusy ? primaryBusyLabel : primaryLabel }
				</Button>
			) }
		</div>
	);
}

export default ConfigFooter;
