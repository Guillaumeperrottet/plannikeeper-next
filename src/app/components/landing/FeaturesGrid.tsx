import Image from "next/image";

const features = [
  {
    img: "/images/feature-1.png",
    title: "Components",
    desc: "Reusable building blocks.",
  },
  {
    img: "/images/feature-2.png",
    title: "Theming",
    desc: "Customizable design tokens.",
  },
  {
    img: "/images/feature-3.png",
    title: "Accessibility",
    desc: "WCAG compliant by default.",
  },
  {
    img: "/images/feature-4.png",
    title: "Documentation",
    desc: "Auto-generated docs.",
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="container mx-auto px-6 py-20">
      <h2 className="text-4xl font-bold text-center mb-12">
        Everything you need
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature) => (
          <div key={feature.title} className="text-center">
            <Image
              src={feature.img}
              alt={feature.title}
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
