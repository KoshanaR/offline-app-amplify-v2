import React, { useEffect, useState } from "react";
import { Todo } from "../models";
import { Box, Stack, TextField, Button, Typography } from "@mui/material";
import { DataStore } from "@aws-amplify/datastore";
import { generateClient } from "aws-amplify/api";
import { createTodo, deleteTodo } from "../graphql/mutations";
import { listTodos } from "../graphql/queries";
import { AuthUser, signOut } from "aws-amplify/auth";
import { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import { onCreateTodo } from "../graphql/subscriptions";
import { CONNECTION_STATE_CHANGE, ConnectionState } from "aws-amplify/api";
import { Hub } from "aws-amplify/utils";

type FormData = {
  name: string;
  description: string;
};

const Home = ({ user }: WithAuthenticatorProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
  });

  const [todoList, setTodoList] = useState<
    { name: string; description: string; id: string; _version: number }[]
  >([]);

  const client = generateClient();

  const initializeDataStore = async () => {
    try {
      await DataStore.start();
    } catch (error) {
      console.log("🚀 ~ initializaDataStore ~ error:", error);
    }
  };

  const createDetails = async () => {
    try {
      if (formData.name !== "" && formData.description !== "") {
        DataStore.save(
          new Todo({
            name: formData.name,
            description: formData.description,
          })
        );

        const input = {
          name: formData.name,
          description: formData.description,
        };

        setFormData({
          name: "",
          description: "",
        });

        await client
          .graphql({ query: createTodo, variables: { input } })
          .then(() => {
            console.log("running this part");
            fetchData();
          });
      }
    } catch (error) {
      console.log("🚀 ~ createDetails ~ error:", error);
    }
  };

  const fetchData = async () => {
    try {
      const apiData = await client.graphql({
        query: listTodos,
        variables: { filter: { _deleted: { ne: true } } },
      });

      const dataFromApi = apiData.data.listTodos.items;

      const filteredArray = dataFromApi.filter((item) => item !== null);

      setTodoList(filteredArray);
    } catch (error) {
      console.log("🚀 ~ fetchData ~ error:", error);
    }
  };

  const deleteTodos = async (id: string, version: number) => {
    try {
      await client.graphql({
        query: deleteTodo,
        variables: { input: { id, _version: version } },
      });

      fetchData();
    } catch (error) {
      console.log("🚀 ~ deleteTodo ~ error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log("🚀 ~ handleSignOut ~ error:", error);
    }
  };

  useEffect(() => {
    initializeDataStore();
    fetchData();
  }, []);

  return (
    <Box>
      <Stack
        direction={"row"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        width={"100%"}
      >
        <Typography>{user?.username}</Typography>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </Stack>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          p: "40px",
        }}
      >
        <Stack
          direction={"column"}
          justifyContent={"center"}
          alignItems={"center"}
          sx={{ width: "100%", height: "100%" }}
          spacing={"10px"}
        >
          <TextField
            placeholder="Name"
            value={formData.name}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
              });
            }}
            fullWidth
          />
          <TextField
            placeholder="Description"
            type="email"
            value={formData.description}
            onChange={(e) => {
              setFormData({
                ...formData,
                description: e.target.value,
              });
            }}
            fullWidth
          />

          <Button
            onClick={createDetails}
            fullWidth
            color="success"
            variant="contained"
          >
            Create
          </Button>
          <Box
            mt="40px"
            p="10px"
            gap="10px"
            display={"flex"}
            flexDirection={"column"}
          >
            {todoList.map((todo, index) => (
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
                spacing={"10px"}
                key={index}
                width="100%"
                sx={{ boxShadow: "rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px" }}
              >
                <Box>
                  <Typography>{todo.name}</Typography>
                  <Typography>{todo.description}</Typography>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => deleteTodos(todo.id, todo._version)}
                >
                  Delete
                </Button>
              </Stack>
            ))}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Home;
