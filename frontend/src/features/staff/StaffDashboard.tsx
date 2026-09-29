import React from "react";
import StaffCard from "./StaffCard";
import DashboardHeader from "../../components/DashboardHeader";

type StaffStatus = "On Site" | "Off Site" | "On Leave";

interface DashboardStaffItem {
  id: string;
  name: string;
  number: string;
  role: string;
  status: StaffStatus;
  isPresent: boolean;
  currentTask: string;
}

const MOCK_STAFF: DashboardStaffItem[] = [
  {
    id: "101",
    name: "Alice Johnson",
    number: "9841234567",
    role: "Event Coordinator",
    status: "On Site",
    isPresent: true,
    currentTask: "Managing registration desk",
  },
];

const StaffDashboard = (): React.JSX.Element => {
  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          title={"Staff Management"}
          subtitle={"Manage your staff members and their assignments"}
          label={"Add Staff"}
          categoriesList={["All", "On Site", "Off Site", "On Leave"]}
        />

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_2fr_1fr] gap-4 px-5 py-3 bg-parchment border-b border-forest-ink/8">
              {["Name", "Role", "Status", "Current Task", "Attendance"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[11px] font-semibold text-lichen-gray uppercase tracking-[0.07em]"
                  >
                    {h}
                  </span>
                ),
              )}

              {MOCK_STAFF.map((staff) => {
                return <StaffCard key={staff.id} />;
              })}
            </div>
          </div>
        </main>

        
      </div>
    </div>
  );
};

export default StaffDashboard;
