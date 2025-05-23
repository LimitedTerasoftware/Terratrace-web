
import { useEffect } from 'react';
import IndiaMap from "./IndiaMap";


const MapOne = () => {
  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white py-2 px-2 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-7">
      {/* <h4 className="mb-2 text-xl font-semibold text-blue-700 dark:text-white">
      India Map with Highlighted States
      </h4> */}
      <div id="mapIndia" className="mapIndia map-btn h-90">
      <IndiaMap />
      </div>
    </div>
  );
};

export default MapOne;
