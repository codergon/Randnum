import { isValidAddress } from "algosdk";
import avatars from "../assets/avatars";
import { ALGOD_CLIENT } from "../constants";

const randAvatar = index => avatars[index];

const constrictAddr = (address, start = 5, end = 5) => {
  if (address && typeof address === "string") {
    return (
      address.substring(0, start) +
      "..." +
      address.substring(address.length - end, address.length)
    );
  }
};

export async function getMinAmountToStartGame(
  ticketFee,
  win_multiplier,
  max_players_allowed,
  assetId = 0
) {
  const appAddr = "JPZNEEIOUSI2XDG37E2JX676HPPCNYILJXD53U63YUNIEOYIOAFDIOKJ4U";
  const appAccountInfo = await ALGOD_CLIENT["testnet"]
    .accountInformation(appAddr)
    .do();

  const appSpendableBalance =
    assetId === 0
      ? appAccountInfo.amount - appAccountInfo["min-balance"]
      : appAccountInfo?.assets?.find(
          asset => Number(asset["asset-id"]) === Number(assetId)
        )?.amount ?? 0;

  const minAmountToStartGame =
    (win_multiplier - 1) * max_players_allowed * ticketFee -
    appSpendableBalance;

  return minAmountToStartGame < 1e6 ? 1 : minAmountToStartGame / 1e6;
}

const getBalance = async address => {
  if (!isValidAddress(address)) return 0;

  try {
    const data = await ALGOD_CLIENT["testnet"].accountInformation(address).do();

    const assets = {};
    data?.assets
      ?.filter(asset => !asset["is-frozen"])
      .map(
        asset =>
          (assets[asset["asset-id"]] =
            isNaN(asset.amount) ||
            asset.amount === Infinity ||
            asset.amount === -Infinity ||
            asset.amount === 0
              ? 0
              : asset.amount / 1e6)
      );

    return {
      ...assets,
      0: data.amount / 1e6,
    };
  } catch (error) {
    console.log(error);
    return 0;
  }
};

export { randAvatar, getBalance, constrictAddr };
