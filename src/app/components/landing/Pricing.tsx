const plans = [
  {
    name: "Standard",
    price: "$29",
    features: ["All components", "Community support", "Regular updates"],
  },
  {
    name: "Goblin+",
    price: "$59",
    features: [
      "Everything in Standard",
      "Premium support",
      "Enterprise features",
    ],
    popular: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="container mx-auto px-6 py-20">
      <h2 className="text-4xl font-bold text-center mb-12">Join the club</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-8 border rounded-xl shadow-md ${
              plan.popular ? "border-blue-600" : ""
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">{plan.name}</h3>
            <p className="text-5xl font-extrabold mb-6">{plan.price}</p>
            <ul className="mb-6 space-y-2">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <a
              href="#"
              className="block text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start {plan.name}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
