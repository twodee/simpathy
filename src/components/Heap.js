import React from 'react';
import { useSelector, /*useDispatch*/ } from 'react-redux';

// import {
  // stopShaking,
// } from '../actions';

// import {
  // Mode,
// } from '../constants';

const Heap = () => {
  // const mode = useSelector(state => state.mode);
  const heap = useSelector(state => state.memory.heap);
  // const dispatch = useDispatch();

  const addresses = Object.keys(heap).map(key => parseInt(key)).sort((a, b) => a - b);

  return (
    <div id="heap-panel">
      <h1>
        Heap
      </h1>
      <div id="heap-entries">
        {
          addresses.map(id => {
            const value = heap[id];
            return <div className="heap-entry" key={id}>
              <div className="heap-id code">
                @{id.toString().padStart(3, '0')}
                <div className="panel-actions">
                  <button>free</button>
                </div>
              </div>
              <div className="heap-value">{value.heapify()}</div>
            </div>;
          })
        }
      </div>
    </div>
  );
};

export default Heap;
