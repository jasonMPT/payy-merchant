import { useEffect, useState } from "react";
import "./App.css";

function App() {
	const [orderId, setOrderId] = useState("ztvbudtlh8");
	const [token, setToken] = useState(import.meta.env.VITE_PAYY_TOKEN);
	const [qr, setQR] = useState(null);
	const [link, setLink] = useState(null);
	const [button, setButton] = useState(null);
	const [orderStatus, setOrderStatus] = useState(false);

	const checkOrderStatus = async () => {
		try {
			const res = await fetch(
				import.meta.env.VITE_PAYY_URL + "/api/order/read",
				{
					method: "POST",
					headers: {
						Authorization:
							"Bearer " + token,
						"Content-Type": "application/json",
						"Accept": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
					body: JSON.stringify({
						merchant_reference: orderId,
					}),
				}
			);
			const json = await res.json();
			console.log(json);
			setOrderStatus(json.paid);
		} catch (error) {
			console.error("Error checking order status:", error);
		}
	};

	const getQR = async () => {
		const res = await fetch(import.meta.env.VITE_PAYY_URL + "/api/generate/qrcode", {
			method: "POST",
			headers: {
				Authorization: "Bearer " + token,
				"Content-Type": "application/json",
				"Accept": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				order_id: orderId,
			}),
		});
		const json = await res.json();
		if(res.ok){
			setQR(
				"<img src='data:image/png;base64, " +
				json.data +
				"' alt='QR Code' />"
			);
		} else {
			setQR("Error generating QR code");
		}
	};
	const getLink = async () => {
		const res = await fetch(
			import.meta.env.VITE_PAYY_URL + "/api/generate/link",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer " + token,
					"Content-Type": "application/json",
					"Accept": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					order_id: orderId,
				}),
			}
		);
		const json = await res.json();
		if(res.ok){
			setLink(json.data);
		} else {
			setLink("Error generating link");
		}
	};
	const getButton = async () => {
		const res = await fetch(
			import.meta.env.VITE_PAYY_URL + "/api/generate/button",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer " + token,
					"Content-Type": "application/json",
					"Accept": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					order_id: orderId,
				}),
			}
		);
		const json = await res.json();
		if(res.ok){
			setButton(json.data);
		} else {
			setButton("Error generating button");
		}
	};

	const generateRandomOrderId = () => {
		return Math.random().toString(36).substring(2, 15);
	};

	const generateNewOrder = async () => {
		console.log("Generating new order");
		const oid = generateRandomOrderId();
		const res = await fetch(
			import.meta.env.VITE_PAYY_URL + "/api/order/store",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer " + token,
					"Content-Type": "application/json",
					"Accept": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					order: {
						oid: oid,
						tax: 2.1,
						subtotal: 10,
						note: "Hello World",
						server: "Jason De Lara",
						items: [
							{
								name: "Burger",
								amount: 10,
								qty: 1,
								desc: "Yes, this is a test",
							},
						],
					},
				}),
			}
		);
		setOrderId(oid);
		setOrderStatus(false);
	};

	useEffect(() => {
		getLink();
		getButton();
		getQR();

		// Set up polling for order status
		const pollInterval = setInterval(checkOrderStatus, 5000); // Check every 5 seconds

		// Clean up interval on component unmount
		return () => clearInterval(pollInterval);
	}, [orderId]);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Payy Merchant Demo
					</h1>
					<div className="flex items-center gap-2">
						<input
							type="password"
							className="px-4 py-2 w-96 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							onChange={(e) => {
								setToken(e.target.value);
							}}
							/>
						<button
							onClick={generateNewOrder}
							className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
							>
							Generate New Order
						</button>
					</div>
				</div>

				{/* Order Details */}
				<div className="bg-white rounded-xl shadow-sm p-6 mb-8">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">
						Order Details
					</h2>
					<div className="space-y-4">
						<div className="bg-gray-50 p-3 rounded-lg">
							<span className="text-gray-600">Order ID:</span>
							<span className="ml-2 font-mono text-gray-900">
								{orderId}
							</span>
						</div>
						<div
							className={`inline-block px-4 py-2 rounded-lg ${
								orderStatus
									? "bg-green-100 text-green-800"
									: "bg-yellow-100 text-yellow-800"
							}`}
						>
							Status: {orderStatus ? "PAID" : "PENDING"}
						</div>
					</div>
				</div>

				{/* Payment Options */}
				<div className="bg-white rounded-xl shadow-sm p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-6">
						Payment Options
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* QR Code */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								QR Code
							</h3>
							<div
								className="flex justify-center bg-white p-4 rounded-lg shadow-sm"
								dangerouslySetInnerHTML={{ __html: qr }}
							></div>
						</div>

						{/* Payment Link */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Payment Link
							</h3>
							<div
								className="bg-white p-4 rounded-lg shadow-sm break-all"
								dangerouslySetInnerHTML={{ __html: link }}
								onClick={(e) => {
									if (e.target.tagName === "A") {
										window.open(e.target.href, "_blank");
									}
								}}
							></div>
						</div>

						{/* Payment Button */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Payment Button
							</h3>
							<div
								className="flex justify-center bg-white p-4 rounded-lg shadow-sm"
								dangerouslySetInnerHTML={{ __html: button }}
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
