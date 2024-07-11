import "./App.css";

import config from "./aws-exports";
import { Amplify } from "aws-amplify";
import { Box, Container } from "@mui/material";
import Home from "./components/Home";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(config, {
  ssr: true,
});

const App = () => {
  return (
    <Box>
      <Container maxWidth="xl">
        <Home />
      </Container>
    </Box>
  );
};

export default withAuthenticator(App);
