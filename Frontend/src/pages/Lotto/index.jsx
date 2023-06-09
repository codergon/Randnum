import "./index.scss";
import _ from "lodash";
import dayjs from "dayjs";
import axios from "axios";
import { useInterval } from "react-use";
import LottoDetails from "./LottoDetails";
import { useEffect, useState } from "react";
import LottoUserActions from "./LottoUserActions";
import Navbar from "../../components/layout/Navbar";
import EmptyState from "../../components/common/EmptyState";

const Lotto = () => {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [phase, setPhase] = useState("ticketing");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentGame = async message => {
    if (data === undefined) setIsLoading(true);
    setError(undefined);

    if (message) console.log(message);

    try {
      const newData = await axios
        .get(`/currentGameParams`)
        .then(response => response?.data?.data);

      if (!!newData) {
        setError(undefined);
        if (!_.isEqual(data, newData)) {
          setData(newData);
        }
      }
    } catch (error) {
      if (data === undefined || !data) {
        setError(error);
      }
    } finally {
      if (isLoading) setIsLoading(false);
    }
  };

  useInterval(() => {
    fetchCurrentGame();
  }, 15000);

  useEffect(() => {
    // Check if ticketing is waiting
    const isWaiting = dayjs(Date.now()).isBefore(
      data?.ticketingStart * 1000,
      "milliseconds",
      "[)"
    );
    if (isWaiting) {
      setPhase("waiting");
      return;
    }

    // Check if ticketing is active
    const isTicketing = dayjs(Date.now()).isBetween(
      data?.ticketingStart * 1000,
      (data?.ticketingStart + data?.ticketingDuration) * 1000,
      "milliseconds",
      "[)"
    );
    if (isTicketing) {
      setPhase("ticketing");
      return;
    }

    // Check if game is live
    const isLive = dayjs(Date.now()).isBetween(
      (data?.ticketingStart + data?.ticketingDuration) * 1000,
      data?.withdrawalStart * 1000,
      "milliseconds",
      "[)"
    );
    if (isLive) {
      setPhase("live");
      return;
    }

    // Check if game is over
    setPhase("withdrawal");
  }, [data]);

  return (
    <div className="lotto-page-main">
      <Navbar />

      <h2 className="lotto-page-title">Current game</h2>
      <LottoUserActions
        phase={phase}
        lottoError={error}
        lottoDetails={data}
        fetchingLotto={isLoading}
        refetchCurrentGame={fetchCurrentGame}
      />
      <div className="lotto-page">
        {isLoading ? (
          <EmptyState title={"Fetching current game"} isLoading />
        ) : error ? (
          <EmptyState
            isError
            title={"An error occurred while fetching game"}
            description={error?.message}
          />
        ) : (
          !!data && (
            <>
              <LottoDetails
                phase={phase}
                data={{
                  ..._.pick(
                    data,
                    "winMultiplier",
                    "maxPlayersAllowed",
                    "ticketFee",
                    "playersTicketBought",
                    "ticketingStart",
                    "ticketingDuration"
                  ),
                  asset: data?.game_asset,
                }}
                asset={data?.game_asset}
                withdrawalStart={data?.withdrawalStart}
              />

              <LottoDetails
                phase={phase}
                data={{
                  luckyNumber: data?.luckyNumber,
                  maxGuessNumber: data?.maxGuessNumber,
                  "current-phase":
                    data?.ticketingStart + data?.ticketingDuration,
                  ..._.pick(data, "withdrawalStart", "playersTicketChecked"),
                }}
                asset={data?.game_asset}
              />
            </>
          )
        )}
      </div>
    </div>
  );
};

export default Lotto;
