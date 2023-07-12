import axios from "axios";
import millify from "millify";
import Icon from "../common/Icon";
import { useRecoilValue } from "recoil";
import { MultiSigner } from "../../utils";
import { useClickAway, useNetworkState } from "react-use";
import { useEffect, useState, useRef } from "react";
import { SpinnerCircular } from "spinners-react";
import { useApp } from "../../context/AppContext";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { getMinAmountToStartGame } from "../../utils/helpers";
import { addressAtom, providerAtom } from "../../atoms/appState";
import asalist from "../../constants/assets";
import { Check } from "lucide-react";

const ticketingOptions = [
  "In 10 minutes",
  "In 30 minutes",
  "In 1 hour",
  "In 2 hours",
];
const withdrawalOptions = [
  "15 minutes after",
  "1 hour after",
  "2 hours after",
  "3 hours after",
  "4 hours after",
];

const NewGameModal = ({ closeNewGameModal, refetchCurrentGame }) => {
  const network = useNetworkState();
  const { acctBalance } = useApp();
  const address = useRecoilValue(addressAtom);
  const provider = useRecoilValue(providerAtom);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [assetId, setAssetId] = useState(0);
  const [ticketFee, setTicketFee] = useState(2);
  const [viewAssets, setViewAssets] = useState(false);
  const [durationType, setDurationType] = useState("m");
  const [winMultiplier, setWinMultiplier] = useState(2);
  const [ticketingDuration, setTicketDuration] = useState(20);
  const [maxGuessNumber, setMaxGuessNumber] = useState(10000);
  const [maxPlayersAllowed, setMaxPlayersAllowed] = useState(2);
  const [ticketingStart, setTicketStart] = useState("In 10 minutes");
  const [withdrawalStart, setWithdrawalStart] = useState("15 minutes after");

  const assetsRef = useRef(null);
  useClickAway(assetsRef, () => {
    setViewAssets(false);
  });

  const ticketingDateValue = () =>
    Math.round(
      Date.now() / 1000 +
        (ticketingStart === "In 10 minutes"
          ? 600
          : ticketingStart === "In 30 minutes"
          ? 1800
          : ticketingStart === "In 1 hour"
          ? 3600
          : 7200)
    );

  const withdrawalDateValue = () =>
    Math.round(
      Date.now() / 1000 +
        (ticketingStart === "In 10 minutes"
          ? 600
          : ticketingStart === "In 30 minutes"
          ? 1800
          : ticketingStart === "In 1 hour"
          ? 3600
          : 7200)
    ) +
    (withdrawalStart === "15 minutes after"
      ? 950
      : withdrawalStart === "1 hour after"
      ? 3600
      : withdrawalStart === "2 hours after"
      ? 7200
      : withdrawalStart === "3 hours after"
      ? 10800
      : 14400) +
    (durationType === "m" ? ticketingDuration * 60 : ticketingDuration * 3600);

  const startNewGame = async () => {
    if (acctBalance[assetId] < gameCost) {
      setError("Insufficient balance!");
      return;
    }

    if (loading) return;
    if (!address) return setError("Please connect your wallet first!");

    const params = {
      assetId: Number(assetId),
      winMultiplier: winMultiplier < 0 ? 2 : winMultiplier,
      ticketFee: (ticketFee > 10 ? 10 : ticketFee < 0 ? 1 : ticketFee) * 1e6,
      ticketingDuration:
        durationType === "m"
          ? ticketingDuration * 60
          : ticketingDuration * 3600,

      maxGuessNumber:
        maxGuessNumber > 10000
          ? 10000
          : maxGuessNumber < 0
          ? 100
          : maxGuessNumber,
      maxPlayersAllowed: maxPlayersAllowed < 2 ? 2 : maxPlayersAllowed,

      gameMasterAddr: address,
      ticketingStart: ticketingDateValue(),
      withdrawalStart: withdrawalDateValue(),
    };

    setError("");
    setLoading(true);
    try {
      const txnsArr = await axios
        .post(`/endCurrentAndCreateNewGame`, params)
        .then(response => {
          return response?.data?.txns;
        });

      if (txnsArr?.length) await MultiSigner(txnsArr, provider);

      console.log("New game started successfully!");

      await refetchCurrentGame();
      closeNewGameModal();
    } catch (error) {
      console.log(error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "An error occurred while creating a new game"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAssetId = id => {
    setAssetId(id);
    setViewAssets(false);
  };

  const handleDurationChange = (value = ticketingDuration) => {
    setTicketDuration(
      value > (durationType === "m" ? 60 : 6)
        ? durationType === "m"
          ? 60
          : 6
        : value < (durationType === "m" ? 10 : 1)
        ? durationType === "m"
          ? 10
          : 1
        : value
    );
  };

  useEffect(() => {
    handleDurationChange();
    // eslint-disable-next-line
  }, [durationType]);

  // Calculate the minimum amount required to start the game
  const [gameCost, setGameCost] = useState(0);
  useEffect(() => {
    if (!network?.online) return;
    const getMinCost = async () => {
      const cost = await getMinAmountToStartGame(
        isNaN(ticketFee) || ticketFee < 1 ? 1 * 1e6 : ticketFee * 1e6,
        isNaN(winMultiplier) || winMultiplier < 2 ? 2 : winMultiplier,
        isNaN(maxPlayersAllowed) || maxPlayersAllowed < 2
          ? 2
          : maxPlayersAllowed,
        assetId
      );

      setGameCost(cost);
    };

    getMinCost();
    // eslint-disable-next-line
  }, [winMultiplier, ticketFee, maxPlayersAllowed, assetId]);

  return (
    <>
      <div className="app-modal__header no-capitalize">
        <h2>Start a new game</h2>
        <button className="close-modal-btn" onClick={closeNewGameModal}>
          <Icon.Close />
        </button>
      </div>

      <div className="app-modal__description">
        <p>Edit the parameters below to create a new game</p>
      </div>

      <div className="new-game-inputs">
        <div className="new-game-input">
          <label htmlFor="winMultiplier">Win Multiplier</label>
          <div className="input-block sm">
            <input
              min={0}
              type="number"
              maxLength={3}
              onBlur={e => {
                setWinMultiplier(e.target.value < 2 ? 2 : e.target.value);
              }}
              placeholder="Min 2"
              name="winMultiplier"
              value={winMultiplier}
              onChange={e =>
                setWinMultiplier(e.target.value < 0 ? 0 : e.target.value)
              }
            />
          </div>
        </div>

        <div className="new-game-input">
          <label htmlFor="maxPlayersAllowed">Max Players</label>
          <div className="input-block sm">
            <input
              min={2}
              type="number"
              maxLength={3}
              onBlur={e => {
                setMaxPlayersAllowed(e.target.value < 2 ? 2 : e.target.value);
              }}
              placeholder="Min 2"
              name="maxPlayersAllowed"
              value={maxPlayersAllowed}
              onChange={e =>
                setMaxPlayersAllowed(e.target.value < 0 ? 0 : e.target.value)
              }
            />
          </div>
        </div>

        <div className="new-game-input">
          <label htmlFor="maxGuessNumber">Max Guess Number</label>
          <div className="input-block">
            <input
              min={100}
              max={10000}
              type="number"
              maxLength={5}
              name="maxGuessNumber"
              onBlur={e => {
                setMaxGuessNumber(
                  e.target.value > 10000
                    ? 10000
                    : e.target.value < 100
                    ? 100
                    : e.target.value
                );
              }}
              value={maxGuessNumber}
              placeholder="Max 10000"
              onChange={e =>
                setMaxGuessNumber(
                  e.target.value > 10000 ? 10000 : e.target.value
                )
              }
            />
          </div>
        </div>

        {/* Assets */}
        <div className="new-game-input assets" ref={assetsRef}>
          <button
            className="content"
            onClick={() => setViewAssets(!viewAssets)}
          >
            <p className="key">Game Asset</p>
            <div className="asset-preview">
              {asalist[Number(assetId)] && (
                <div className="asset">
                  <img
                    src={
                      asalist[Number(assetId)]?.logo?.svg ??
                      asalist[Number(assetId)]?.logo?.png
                    }
                    alt="game asset"
                  />
                  <p>{asalist[Number(assetId)]?.unit_name}</p>
                </div>
              )}
              <Icon.CaretDownBold size={9} color={"#23232380"} />
            </div>
          </button>

          {viewAssets && (
            <div className="asset-list">
              {(Object.keys(acctBalance) || []).map((asset, index) => {
                return (
                  asalist[Number(asset)] && (
                    <button
                      key={index}
                      onClick={() => {
                        updateAssetId(asset);
                      }}
                      className="asset-item"
                    >
                      <img
                        src={
                          asalist[Number(asset)]?.logo?.svg ??
                          asalist[Number(asset)]?.logo?.png
                        }
                        alt=""
                      />

                      <div className="details">
                        <p className="main">{asalist[Number(asset)]?.name}</p>
                        <p className="sub">
                          {asalist[Number(asset)]?.unit_name}
                        </p>
                      </div>

                      {Number(assetId) === Number(asset) && <Check size={14} />}
                    </button>
                  )
                );
              })}
            </div>
          )}
        </div>

        <div className="new-game-input">
          <label htmlFor="ticketFee">Ticket Fee</label>
          <div className="input-block ticket">
            <input
              type="number"
              placeholder="Min 1"
              name="ticketFee"
              maxLength={3}
              value={ticketFee}
              onBlur={e => {
                setTicketFee(
                  e.target.value > 20
                    ? 20
                    : e.target.value < 1
                    ? 1
                    : e.target.value
                );
              }}
              onChange={e =>
                setTicketFee(e.target.value > 20 ? 20 : e.target.value)
              }
            />
            <div style={{ paddingBottom: 2 }}>
              {asalist[Number(assetId)] && (
                <img
                  src={
                    asalist[Number(assetId)]?.logo?.svg ??
                    asalist[Number(assetId)]?.logo?.png
                  }
                  alt="game asset"
                />
              )}
            </div>
          </div>
        </div>

        <div className="new-game-input">
          <label htmlFor="ticketFee">Ticketing Duration</label>

          <div className="time-options">
            <div className="time-option">
              <input
                min={0}
                max={60}
                type="number"
                value={ticketingDuration}
                onBlur={e => handleDurationChange(e.target.value)}
                onChange={e =>
                  e.target.value.length < 4 &&
                  setTicketDuration(
                    e.target.value > (durationType === "m" ? 60 : 6)
                      ? durationType === "m"
                        ? 60
                        : 6
                      : e.target.value < 0
                      ? 0
                      : e.target.value
                  )
                }
              />
            </div>

            <div className="time-option">
              <Menu
                menuButton={
                  <button className="select-btn">
                    <p>{durationType === "m" ? "Mins" : "Hrs"}</p>

                    <Icon.CaretDownBold size={9} color={"#23232380"} />
                  </button>
                }
                align="end"
                transition
                direction="top"
                offsetY={8}
                offsetX={8}
                unmountOnClose={true}
                onItemClick={e => {
                  setDurationType(e.value);
                }}
                menuClassName="time-picker"
              >
                <MenuItem
                  value={"m"}
                  className={`time-picker-item ${
                    durationType === "m" ? "active" : ""
                  }`}
                >
                  <p>Mins</p>
                </MenuItem>
                <MenuItem
                  value={"h"}
                  className={`time-picker-item ${
                    durationType === "h" ? "active" : ""
                  }`}
                >
                  <p>Hrs</p>
                </MenuItem>
              </Menu>
            </div>
          </div>
        </div>

        <div className="new-game-input">
          <label htmlFor="ticketingStart">Ticketing starts</label>

          <div className="time-options">
            <div className="time-option">
              <Menu
                menuButton={
                  <button className="select-btn">
                    <p>{ticketingStart}</p>
                    <Icon.CaretDownBold size={9} color={"#23232380"} />
                  </button>
                }
                align="end"
                transition
                direction="top"
                offsetY={8}
                offsetX={8}
                unmountOnClose={true}
                onItemClick={e => {
                  setTicketStart(e.value);
                }}
                menuClassName="time-picker wide"
              >
                {ticketingOptions?.map((item, index) => {
                  return (
                    <MenuItem
                      key={index}
                      value={item}
                      className={`time-picker-item ${
                        ticketingStart === item ? "active" : ""
                      }`}
                    >
                      <p>{item}</p>
                    </MenuItem>
                  );
                })}
              </Menu>
            </div>
          </div>
        </div>

        <div className="new-game-input">
          <label htmlFor="withdrawalStart">Withdrawal starts</label>

          <div className="time-options">
            <div className="time-option">
              <Menu
                menuButton={
                  <button className="select-btn">
                    <p>{withdrawalStart}</p>
                    <Icon.CaretDownBold size={9} color={"#23232380"} />
                  </button>
                }
                align="end"
                transition
                direction="top"
                offsetY={8}
                offsetX={8}
                unmountOnClose={true}
                onItemClick={e => {
                  setWithdrawalStart(e.value);
                }}
                menuClassName="time-picker wide"
              >
                {withdrawalOptions?.map((item, index) => {
                  return (
                    <MenuItem
                      key={index}
                      value={item}
                      className={`time-picker-item ${
                        withdrawalStart === item ? "active" : ""
                      }`}
                    >
                      <p>{item}</p>
                    </MenuItem>
                  );
                })}
              </Menu>
            </div>
          </div>
        </div>

        <div className="calculations">
          <div className="calculations-row">
            <p className="key">Account balance: </p>

            <div className="amount">
              {asalist[Number(assetId)] && (
                <img
                  src={
                    asalist[Number(assetId)]?.logo?.svg ??
                    asalist[Number(assetId)]?.logo?.png
                  }
                  alt="game asset"
                />
              )}
              <p className="value">
                {millify(acctBalance[assetId], {
                  precision: 2,
                })}
              </p>
            </div>
          </div>
          <div
            className={`calculations-row ${
              gameCost < acctBalance[assetId] ? "valid" : "error"
            }`}
          >
            <p className="key">Min amount required: </p>

            <div className="amount">
              {asalist[Number(assetId)] && (
                <img
                  src={
                    asalist[Number(assetId)]?.logo?.svg ??
                    asalist[Number(assetId)]?.logo?.png
                  }
                  alt="game asset"
                />
              )}
              <p className="value">{gameCost}</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <SpinnerCircular size={50} color="#777" secondaryColor="#ccc" />
          </div>
        )}
      </div>

      {!!error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <button
        className={
          "connect-wallet-btn" +
          (!!error ? " error" : "") +
          (loading ? " loading" : "")
        }
        onClick={startNewGame}
      >
        {loading ? "Creating New Game..." : "Create Game"}
      </button>
    </>
  );
};

export default NewGameModal;
