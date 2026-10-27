import { Intro } from "@/components/intro/intro";
import { Graticule } from "@/components/map/graticule";
import { MapWindow } from "@/components/map/map-window";
import { Neatline, NorthArrow, Readout, ScaleBar } from "@/components/map/marginalia";
import { Terrain } from "@/components/map/terrain";
import { RegistrationForm } from "@/components/registration-form";
import { Wordmark } from "@/components/wordmark";
import { copy } from "@/lib/copy";

export default function Home() {
  return (
    <>
      <Terrain />
      <Graticule />
      <Neatline />
      <Intro />
      <div className="page relative z-20 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <header className="flex items-start justify-between gap-3 pt-9">
          <Wordmark />
          <NorthArrow />
        </header>
        <MapWindow />
        <main className="cartouche relative">
          <div className="halo" aria-hidden="true" data-intro-hide />
          <p className="lead relative mb-7 max-w-[34ch] text-ink" data-intro-hide>
            {copy.lead}
          </p>
          <RegistrationForm />
        </main>
        <footer className="sheet-footer mt-auto flex items-end justify-between pb-5 pt-8">
          <ScaleBar />
          <Readout />
        </footer>
      </div>
    </>
  );
}
