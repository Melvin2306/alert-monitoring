import SetupClientApi from "./SetupClientApi";

const SetupApi = () => {
  const apiUrl = process.env.CHANGEDETECTION_URL || "http://localhost:8080";

  return <SetupClientApi apiUrl={apiUrl} />;
};

export default SetupApi;
