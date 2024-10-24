import React, { useState, useEffect, useRef } from 'react';
import { sortBy } from "lodash";
import { useWindowSize } from "rooks";
import useOpenCV from "./customHooks/useOpenCV";
import { flags as flagsData, FlagData, listOfFlagKeys } from "./constant";
import FlagsSelect from "./components/FlagsSelect";
import ThreeCanvas from "./components/ThreeCanvas";
import Help3D from "./components/Help3D";
import CopyToClipboardButton from "./components/CopyToClipboardButton";
import './App.css';

const flagKeys = listOfFlagKeys();

function App() {
  const { openCVLoaded } = useOpenCV();
  const [velocity, setVelocity] = useState<number>(0.001);
  const { innerWidth, innerHeight } = useWindowSize();
  const refContainer = useRef<HTMLDivElement>(null);
  const [widthContainer, setWidthContainer] = useState<number>(500);
  const [heightContainer, setHeightContainer] = useState<number>(500);
  const [flags] = useState<FlagData[]>(sortBy(flagsData, 'name'));
  const [filename, setFilename] = useState<string|null>(null);
  const [alignMeshes, setAlignMeshes] = useState<boolean>(false);


  useEffect(() => {
    if(openCVLoaded) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const urlParams = Object.fromEntries(urlSearchParams.entries());
      if(urlParams.flag && flagKeys.includes(urlParams.flag)) {
        setFilename(urlParams.flag)
        setAlignMeshes(false);
      }
    }
  }, [openCVLoaded]);

  useEffect(() => {
    if(refContainer.current && innerHeight && innerWidth) {
      const rect = refContainer.current.getBoundingClientRect();
      setWidthContainer(rect.width);
      setHeightContainer(innerHeight);
    }
  }, [innerWidth, innerHeight, refContainer]);


  function onChange(filename: string) {
    setFilename(filename);
    setAlignMeshes(false);
    window.history.replaceState(null, "", `?flag=${filename}`);
  }


  return (
    <div className="App">
      <div className="flex flex-col justify-center gap-5" ref={refContainer}>
        <div className="lg:absolute md:static lg:top-8 lg:left-8 lg:max-w-xs md:max-w-full md:w-full">
          <div className="card bg-base-100 shadow-2xl w-full">
           <div className="card-body p-3 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
              { openCVLoaded ?
                <FlagsSelect value={filename || ""} flags={flags} onChange={onChange} /> :
                <p>Loading Open CV</p>
              }
              <p className="text-xs">A flag is missing ? please create an issue
                <a className="link link-secondary px-1" href="https://github.com/guillaume-gomez/glags/issues">here</a>
              </p>
              </div>
              <div>
                <input
                  type="range"
                  className="range range-primary"
                  min={0}
                  max={10}
                  step={0.01}
                  value={velocity * 1000}
                  onChange={(e) => setVelocity(parseFloat(e.target.value)/1000)}
                />
                <label>Velocity : {velocity * 1000}</label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Align all shapes</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={alignMeshes}
                    onClick={() => setAlignMeshes(!alignMeshes)}
                  />
                </label>
              </div>
              <CopyToClipboardButton initialLabel={"Share your colors"}/>
              <Help3D />
              <p className="text-xs">Double click to switch to fullscreen</p>
              <div id="image-container">
                  {
                    flags.map(({key, name}) =>
                      <img
                        key={key}
                        className="hidden"
                        id={key}
                        src={`${process.env.PUBLIC_URL}/textures/${key}`}
                        alt={`Flag of ${name}`}
                      />
                    )
                  }
              </div>
            </div>
          </div>
        </div>
        <ThreeCanvas
          alignMeshes={alignMeshes}
          filename={filename || ""}
          velocity={velocity}
          width={widthContainer}
          height={heightContainer}
        />
      </div>
    </div>
  );
}

export default App;
