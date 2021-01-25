import mockUsersData from "./mock-users-data.json";

const pageSize = 10;

export async function getUsers(options) {
  const pageIndex = options.pageIndex || 0;
  const start = pageIndex * pageSize;
  const users = [];

  for (let i = start; i < start + pageSize; i++) {
    users.push(mockUsersData[i % mockUsersData.length]);
  }

  const results = {
    users,
    pageIndex,
    totalMatches: mockUsersData.length
  };

  await sleep(1000);

  return results;
};

function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}