export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center"
      style={{
        background:
          "radial-gradient(ellipse at 60% 60%, #ffd6cf 60%, #ffb48a 100%)",
      }}
    >
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
        <div className="text-left w-full md:w-2/3">
          <h1 className="text-[6vw] md:text-[5vw] font-extrabold leading-none text-black">
            Update
            <br />
            <span className="font-normal">your</span>{" "}
            <span
              className="align-middle"
              style={{
                fontFamily: "'VT323', monospace",
                letterSpacing: "0.05em",
                fontWeight: 700,
                fontSize: "1em",
                display: "inline-block",
              }}
            >
              brand
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}
