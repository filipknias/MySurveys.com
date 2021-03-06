import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
// Components
import SurveyCardHeader from "../components/surveys/SurveyCardHeader";
import ShareSurveyPopover from "../components/surveys/ShareSurveyPopover";
import Error from "../components/Error";
// Bootstrap
import Image from "react-bootstrap/Image";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import ProgressBar from "react-bootstrap/ProgressBar";
// Images
import VoteIcon from "../components/img/vote-icon.svg";

export default function ResultsSurvey(props) {
  // State
  const [survey, setSurvey] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState([]);
  const [progressBarColors, setProgressBarColors] = useState([]);

  const PROGRESS_BAR_COLORS = [
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "dark",
  ];

  // Set survey
  useEffect(() => {
    // Start loading
    setLoading(true);

    const cancelTokenSource = axios.CancelToken.source();
    const surveyId = props.match.params.surveyId;

    axios
      .get(`/api/surveys/get/${surveyId}`, {
        cancelToken: cancelTokenSource.token,
      })
      .then((res) => {
        // Clear error
        setError(null);
        // Set survey
        setSurvey(res.data);
        // Stop loading
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        // Set error
        setError(err.response.data.error);
        // Stop loading
        setLoading(false);
      });

    return () => {
      cancelTokenSource.cancel();
    };
  }, []);

  // Set votes
  useEffect(() => {
    // Check if survey is fetched
    if (Object.keys(survey).length === 0) return;

    // Start loading
    setLoading(true);

    const cancelTokenSource = axios.CancelToken.source();
    axios
      .get(`/api/votes/${survey._id}`, { cancelToken: cancelTokenSource.token })
      .then((res) => {
        // Clear error
        setError(null);
        // Get survey votes in one array
        const surveyVotes = res.data.map((vote) => {
          return vote.answers.map((answer) => {
            return answer;
          });
        });
        // Set formatted votes
        setVotes(formatVotes(surveyVotes));
        // Stop loading
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        // Set error
        setError(err.response.data.error);
        // Stop loading
        setLoading(false);
      });

    return () => {
      cancelTokenSource.cancel();
    };
  }, [survey]);

  // Set progress bar colors
  useEffect(() => {
    setProgressBarColors(formatProgressBarColors(votes.length));
  }, [votes]);

  // Progress colors
  const formatProgressBarColors = (colorsAmount) => {
    const colors = [];
    let current = 0;
    while (colors.length <= colorsAmount) {
      colors.push(PROGRESS_BAR_COLORS[current]);
      current++;
      if (current > PROGRESS_BAR_COLORS.length - 1) current = 0;
    }
    return colors;
  };

  // Format votes
  const formatVotes = (votes) => {
    // Get all votes in one array
    const votesValues = votes.reduce((total, current) => {
      return total.concat(current);
    }, []);

    // Sort all votes by their answer
    const formattedAnswers = survey.answers.map((answerValue) => {
      return votesValues.filter((voteValue) => {
        return voteValue.id === answerValue.id;
      });
    });

    // Format sorted votes to object with answer and votesCount as keys
    const formattedVotes = formattedAnswers.map((vote, index) => {
      return {
        answer: survey.answers[index],
        votesCount: vote.length,
        progressBarLabel: calcProgress(vote.length, survey.votesCount),
      };
    });

    // Sort formatted votes by descending order
    const sortedVotes = formattedVotes.sort((a, b) => {
      return b.votesCount - a.votesCount;
    });

    return sortedVotes;
  };

  // Calculate progress to %
  const calcProgress = (num, total) => {
    if (total === 0) return 0;
    const convertedNum = (num / total) * 100;
    return Math.round(convertedNum);
  };

  return (
    <>
      {error ? (
        <Error message={error} />
      ) : (
        <Card border="dark">
          <Card.Header className="text-center" as="h5">
            See <span className="green-text">Results</span>
          </Card.Header>
          <Card.Body className="px-md-4">
            {loading ? (
              <Spinner animation="border" className="m-auto d-block" />
            ) : (
              <>
                {survey.author && <SurveyCardHeader survey={survey} />}
                <h4 className="my-3">
                  Total Votes:{" "}
                  <span className="green-text">{survey.votesCount}</span>
                </h4>
                {votes.map((vote, index) => (
                  <div className="my-4" key={index}>
                    <p className="mb-1">{vote.answer.value}</p>
                    <ProgressBar
                      now={vote.progressBarLabel}
                      label={`${vote.progressBarLabel}%`}
                      variant={progressBarColors[index]}
                    />
                  </div>
                ))}
                <div className="d-flex justify-content-between justify-content-md-end mt-5">
                  <Link to={`/surveys/${survey._id}/vote`}>
                    <Button
                      type="button"
                      variant="info"
                      className=" mr-4 px-md-5"
                    >
                      <Image src={VoteIcon} height="18" className="mr-2" />
                      Vote
                    </Button>
                  </Link>
                  <ShareSurveyPopover />
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
}
