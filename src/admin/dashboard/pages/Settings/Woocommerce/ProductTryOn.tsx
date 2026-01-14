import { Button } from "../../../../../components";
import { toast } from "@tryaura/components";

function ProductTryOn() {
	return (
		<div className="flex justify-between flex-wrap bg-[#FFFFFF] border-2 border-[#FFFFFF] p-6 rounded-2xl">
			<Button
				onClick={ () => toast.success('Hello') }
				loading={true}
			>
				Enable/Disable
			</Button>
		</div>
	);
}

export default ProductTryOn;
