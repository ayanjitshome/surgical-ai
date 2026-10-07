/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const getMeta = () => client.get("/meta").then((r) => r.data);
export const getTools = () => client.get("/tools").then((r) => r.data.tools);
export const getTool = (id) => client.get(`/tools/${id}`).then((r) => r.data);
export const getEcosystem = () => client.get("/ecosystem").then((r) => r.data);
export const postDecision = (answers) => client.post("/decision", answers).then((r) => r.data);
export const getGuidance = () => client.get("/guidance/tradeoffs").then((r) => r.data);
export const refreshTool = (id) => client.post(`/admin/refresh/${id}`).then((r) => r.data);

export default client;
