// const EventsDashboard = () => {
//     return (
//         <div>
//             Events Dashboards
//         </div>
//     );
// }

// export default EventsDashboard;

import { useState } from "react";
import CreateEventModal from "./CreateEventModal";

const EventsDashboard = () => {
  // TEMP: testing modal styling, will remove before opening PR
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div>
      Events Dashboard
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default EventsDashboard;
