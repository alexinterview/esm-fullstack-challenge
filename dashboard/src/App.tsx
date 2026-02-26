import { Admin, Resource, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";

import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RouteIcon from "@mui/icons-material/Route";
import EmojiFlagsIcon from "@mui/icons-material/EmojiFlags";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import Groups3Icon from "@mui/icons-material/Groups3";
import Filter1Icon from "@mui/icons-material/Filter1";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Dashboard } from "./pages/dashboard";
import { Layout } from "./Layout";

import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import { RegisterPage } from "./RegisterPage";
import { LoginPage } from "./LoginPage";

import { RaceList } from "./pages/races";
import { DriverList, DriverShow, DriverEdit } from "./pages/drivers";
import { CircuitList } from "./pages/circuits";
import { ConstructorList } from "./pages/constructors";
import { StatusList } from "./pages/status";
import { ResultList } from "./pages/results";
import { QualifyingList } from "./pages/qualifying";
import { DriverStandingList } from "./pages/driverStandings";
import { ConstructorStandingList } from "./pages/constructorStandings";
import { ConstructorResultList } from "./pages/constructorResults";

export const App = () => (
  <Admin
    layout={Layout}
    dashboard={Dashboard}
    dataProvider={dataProvider}
    authProvider={authProvider}
    loginPage={LoginPage}
  >
    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
    </CustomRoutes>
    <Resource icon={EmojiFlagsIcon} name="races" list={RaceList} />
    <Resource
      icon={PersonIcon}
      name="drivers"
      list={DriverList}
      show={DriverShow}
      edit={DriverEdit}
    />
    <Resource
      icon={Filter1Icon}
      name="driver_standings"
      list={DriverStandingList}
    />
    <Resource icon={RouteIcon} name="circuits" list={CircuitList} />
    <Resource icon={EmojiEventsIcon} name="results" list={ResultList} />
    <Resource icon={SportsScoreIcon} name="qualifying" list={QualifyingList} />
    <Resource
      icon={DirectionsCarIcon}
      name="constructors"
      list={ConstructorList}
    />
    <Resource
      icon={FormatListNumberedIcon}
      name="constructor_standings"
      list={ConstructorStandingList}
    />
    <Resource
      icon={Groups3Icon}
      name="constructor_results"
      list={ConstructorResultList}
    />
    <Resource icon={CheckBoxIcon} name="status" list={StatusList} />
  </Admin>
);
