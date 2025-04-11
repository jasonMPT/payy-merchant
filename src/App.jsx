import { useEffect, useState } from "react";
import "./App.css";

function App() {
	const [orderId, setOrderId] = useState("ztvbudtlh8");
	const [token, setToken] = useState(import.meta.env.VITE_PAYY_TOKEN);
	const [qr, setQR] = useState(null);
	const [link, setLink] = useState(null);
	const [button, setButton] = useState(null);
	const [orderStatus, setOrderStatus] = useState(false);
	const [lineItems, setLineItems] = useState([
		{ name: "", cost: "", qty: "1", desc: "" },
	]);
	const [server, setServer] = useState("");
	const [note, setNote] = useState("");
	const [errors, setErrors] = useState({});

	const calculateTotal = () => {
		return lineItems
			.reduce((total, item) => {
				const cost = parseFloat(item.cost) || 0;
				const qty = parseInt(item.qty) || 0;
				return total + cost * qty;
			}, 0)
			.toFixed(2);
	};

	const validateForm = () => {
		const newErrors = {};
		if (!server.trim()) {
			newErrors.server = "Server name is required";
		}
		lineItems.forEach((item, index) => {
			if (!item.name.trim()) {
				newErrors[`name-${index}`] = "Item name is required";
			}
			if (!item.cost || parseFloat(item.cost) <= 0) {
				newErrors[`cost-${index}`] = "Valid cost is required";
			}
			if (!item.qty || parseInt(item.qty) <= 0) {
				newErrors[`qty-${index}`] = "Valid quantity is required";
			}
		});
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const addLineItem = () => {
		setLineItems([
			...lineItems,
			{ name: "", cost: "", qty: "1", desc: "" },
		]);
	};

	const removeLineItem = (index) => {
		const newItems = lineItems.filter((_, i) => i !== index);
		setLineItems(newItems);
		setErrors({});
	};

	const updateLineItem = (index, field, value) => {
		const newItems = [...lineItems];
		if (field === "cost") {
			// Format cost to always have 2 decimal places
			const formattedValue = parseFloat(value).toFixed(2);
			newItems[index][field] = isNaN(formattedValue)
				? value
				: formattedValue;
		} else {
			newItems[index][field] = value;
		}
		setLineItems(newItems);
		// Clear error for this field when updated
		const newErrors = { ...errors };
		delete newErrors[`${field}-${index}`];
		setErrors(newErrors);
	};

	const clearForm = () => {
		setLineItems([{ name: "", cost: "", qty: "1", desc: "" }]);
		setServer("");
		setNote("");
		setErrors({});
	};

	const checkOrderStatus = async () => {
		try {
			const res = await fetch(
				import.meta.env.VITE_PAYY_URL + "/api/order/read",
				{
					method: "POST",
					headers: {
						Authorization: "Bearer " + token,
						"Content-Type": "application/json",
						Accept: "application/json",
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
		const res = await fetch(
			import.meta.env.VITE_PAYY_URL + "/api/generate/qrcode",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer " + token,
					"Content-Type": "application/json",
					Accept: "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					order_id: orderId,
				}),
			}
		);
		const json = await res.json();
		if (res.ok) {
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
					Accept: "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					order_id: orderId,
				}),
			}
		);
		const json = await res.json();
		if (res.ok) {
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
					Accept: "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					order_id: orderId,
				}),
			}
		);
		const json = await res.json();
		if (res.ok) {
			setButton(json.data);
		} else {
			setButton("Error generating button");
		}
	};

	const generateRandomOrderId = () => {
		return Math.random().toString(36).substring(2, 15);
	};

	const generateNewOrder = async () => {
		if (!validateForm()) {
			return;
		}
		const oid = generateRandomOrderId();

		try {
			const res = await fetch(
				import.meta.env.VITE_PAYY_URL + "/api/order/store",
				{
					method: "POST",
					headers: {
						Authorization: "Bearer " + token,
						"Content-Type": "application/json",
						Accept: "application/json",
						"Access-Control-Allow-Origin": "*",
					},
					body: JSON.stringify({
						order: {
							oid: oid,
							tax: 0,
							subtotal: calculateTotal(),
							note: note || "Payy Merchant Demo",
							server: server,
							items: lineItems.map((item) => ({
								name: item.name,
								amount: parseFloat(item.cost),
								qty: parseInt(item.qty),
								desc: item.desc,
							})),
						},
					}),
				}
			);
			const json = await res.json();
			setOrderId(oid);
			setOrderStatus(false);
		} catch (error) {
			console.error("Error creating order:", error);
		}
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
							placeholder="Enter your Payy API Token"
							className="px-4 py-2 w-96 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							onChange={(e) => {
								setToken(e.target.value);
							}}
						/>
					</div>
				</div>

				{/* Order Details */}
				<div className="bg-white rounded-xl shadow-sm p-6 mb-8">
					<div className="flex justify-between items-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900">
							Order Details
						</h1>
						<div className="flex items-center gap-2">
							<button
								onClick={clearForm}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
							>
								Clear Form
							</button>
							<button
								onClick={generateNewOrder}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
							>
								Generate New Order
							</button>
						</div>
					</div>
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<div className="flex-1">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Server Name
								</label>
								<input
									type="text"
									value={server}
									onChange={(e) => {
										setServer(e.target.value);
										setErrors({ ...errors, server: null });
									}}
									className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
										errors.server
											? "border-red-500"
											: "border-gray-300"
									}`}
									placeholder="Enter server name"
								/>
								{errors.server && (
									<p className="mt-1 text-sm text-red-600">
										{errors.server}
									</p>
								)}
							</div>
							<div className="flex-1">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Order Note
								</label>
								<input
									type="text"
									value={note}
									onChange={(e) => setNote(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Enter order note"
								/>
							</div>
						</div>
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<h3 className="text-lg font-medium text-gray-900">
									Line Items
								</h3>
								<button
									onClick={addLineItem}
									className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
								>
									Add Item
								</button>
							</div>
							{lineItems.map((item, index) => (
								<div
									key={index}
									className="grid grid-cols-12 gap-4 items-end"
								>
									<div className="col-span-3">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Name
										</label>
										<input
											type="text"
											value={item.name}
											onChange={(e) =>
												updateLineItem(
													index,
													"name",
													e.target.value
												)
											}
											className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
												errors[`name-${index}`]
													? "border-red-500"
													: "border-gray-300"
											}`}
											placeholder="Item name"
										/>
										{errors[`name-${index}`] && (
											<p className="mt-1 text-sm text-red-600">
												{errors[`name-${index}`]}
											</p>
										)}
									</div>
									<div className="col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Cost
										</label>
										<input
											type="number"
											value={item.cost}
											onChange={(e) =>
												updateLineItem(
													index,
													"cost",
													e.target.value
												)
											}
											className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
												errors[`cost-${index}`]
													? "border-red-500"
													: "border-gray-300"
											}`}
											placeholder="0.00"
											step="0.01"
											min="0"
										/>
										{errors[`cost-${index}`] && (
											<p className="mt-1 text-sm text-red-600">
												{errors[`cost-${index}`]}
											</p>
										)}
									</div>
									<div className="col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Quantity
										</label>
										<input
											type="number"
											value={item.qty}
											onChange={(e) =>
												updateLineItem(
													index,
													"qty",
													e.target.value
												)
											}
											className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
												errors[`qty-${index}`]
													? "border-red-500"
													: "border-gray-300"
											}`}
											placeholder="1"
											min="1"
										/>
										{errors[`qty-${index}`] && (
											<p className="mt-1 text-sm text-red-600">
												{errors[`qty-${index}`]}
											</p>
										)}
									</div>
									<div className="col-span-4">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Description
										</label>
										<input
											type="text"
											value={item.desc}
											onChange={(e) =>
												updateLineItem(
													index,
													"desc",
													e.target.value
												)
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											placeholder="Item description"
										/>
									</div>
									<div className="col-span-1">
										<button
											onClick={() =>
												removeLineItem(index)
											}
											className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
										>
											×
										</button>
									</div>
								</div>
							))}
						</div>
						<div className="flex justify-end items-center mt-4">
							<div className="text-lg font-semibold text-gray-900">
								Total: ${calculateTotal()}
							</div>
						</div>
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
