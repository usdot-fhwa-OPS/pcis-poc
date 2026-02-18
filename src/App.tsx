import './App.css';
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar/app-sidebar"
import './index.css';

function App() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <h3>Home</h3>
      </main>
    </SidebarProvider>
  );
}

export default App;
