import { FC } from "react"
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideBar from "@/components/SideBar";
import Dashboard from "@/components/Dashboard";

type Props = {
    children: React.ReactNode;
    fixedSidebar?: boolean;
    fixedHeader?: boolean;
}

export const Layout: FC<Props> = ({ fixedSidebar, fixedHeader, children }) => {  

    const generateContainerClasses = () => {
        if (fixedHeader && !fixedSidebar) {
          return "comp-container fixed-header";
        } else if (!fixedHeader && fixedSidebar) {
          return "comp-container fixed-sidebar";
        } else if (fixedHeader && fixedSidebar) {
          return "comp-container fixed-header fixed-sidebar";
        } else {
          return "comp-container";
        }
      };

    return (
        <div className={generateContainerClasses()} style={{
            width: '100%',
          }}>
            <Header />
            <div >{children}</div>
            <Footer />
        </div>
    );
  };
