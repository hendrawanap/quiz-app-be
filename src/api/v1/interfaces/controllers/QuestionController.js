const {
  GetAllQuestions,
  GetQuestionsByTopic,
  GetQuestion,
  AddQuestion,
  DeleteQuestion,
  UpdateQuestion,
} = require('../../application/use-cases/questions/index');

const {
  IndexValidator, ShowValidator, StoreValidator, UpdateValidator, DestroyValidator,
} = require('../validations/questions');

const generateImgUrl = (topic, filename) => {
  let imgUrl;
  switch (topic) {
    case 'Makanan': imgUrl = `foods/${Date.now()}-${filename}`; break;
    case 'Ikon': imgUrl = `icons/${Date.now()}-${filename}`; break;
    case 'Wisata': imgUrl = `tourisms/${Date.now()}-${filename}`; break;
    default: imgUrl = null;
  }
  return imgUrl;
};

const badRequestResponse = (h, message) => h.response({ message }).code(400);

const index = async (request, h) => {
  const { questionRepository } = request.server.app.dependencies;
  const { topic } = request.query;
  const { isValid, message } = IndexValidator.validate({ topic });
  let questions;
  let response;

  if (!isValid) {
    return badRequestResponse(h, message);
  }

  try {
    questions = topic
      ? await GetQuestionsByTopic(questionRepository).execute(topic)
      : await GetAllQuestions(questionRepository).execute();

    response = h.response(questions);
    response.code(200);
    return response;
  } catch (error) {
    response = h.response({
      message: error.message,
    });
    response.code(500);
    return response;
  }
};

const show = async (request, h) => {
  const { questionRepository } = request.server.app.dependencies;
  const { id } = request.params;
  const { isValid, message } = ShowValidator.validate({ id });
  let question;
  let response;

  if (!isValid) {
    return badRequestResponse(h, message);
  }

  try {
    question = await GetQuestion(questionRepository).execute(id);

    response = h.response(question);
    response.code(200);
    return response;
  } catch (error) {
    if (error.message === 'Not Found') {
      response = h.response({
        message: error.message,
      });
      response.code(404);
    } else {
      response = h.response({
        message: error.message,
      });
      response.code(500);
    }
    return response;
  }
};

const store = async (request, h) => {
  const { questionRepository } = request.server.app.dependencies;
  const { imgFile, json } = request.payload;
  const { isValid, message } = StoreValidator.validate({ imgFile, json });
  let response;

  if (!isValid) {
    return badRequestResponse(h, message);
  }

  const {
    question, answer, choices, topic,
  } = JSON.parse(json);

  try {
    let questionId;

    if (imgFile) {
      const imgUrl = generateImgUrl(topic, imgFile.hapi.filename);
      questionId = await AddQuestion(questionRepository).execute({
        question, answer, choices, imgUrl, topic,
      }, imgFile);
    } else {
      questionId = await AddQuestion(questionRepository).execute({
        question, answer, choices, topic,
      });
    }

    response = h.response({
      message: `Question created with id: ${questionId}`,
    });
    response.code(201);
    return response;
  } catch (error) {
    response = h.response({
      message: error.message,
    });
    response.code(500);
    return response;
  }
};

const update = async (request, h) => {
  const { questionRepository } = request.server.app.dependencies;
  const { imgFile, json } = request.payload;
  const { id } = request.params;
  const { isValid, message } = UpdateValidator.validate({ imgFile, json, id });

  if (!isValid) {
    return badRequestResponse(h, message);
  }

  const {
    question, answer, choices, topic,
  } = JSON.parse(json);

  let response;

  try {
    let updateTime;

    if (imgFile) {
      const imgUrl = generateImgUrl(topic, imgFile.hapi.filename);
      updateTime = await UpdateQuestion(questionRepository).execute({
        id, question, answer, choices, imgUrl, topic,
      }, imgFile);
    } else {
      updateTime = await UpdateQuestion(questionRepository).execute({
        id, question, answer, choices, topic,
      });
    }

    response = h.response({ updateTime });
    response.code(200);
    return response;
  } catch (error) {
    response = h.response({
      message: error.message,
    });

    if (error.message === 'Not Found') {
      response.code(404);
    } else {
      response.code(500);
    }

    return response;
  }
};

const destroy = async (request, h) => {
  const { questionRepository } = request.server.app.dependencies;
  const { id } = request.params;
  const { isValid, message } = DestroyValidator.validate({ id });

  if (!isValid) {
    return badRequestResponse(message);
  }

  let response;

  try {
    const deleteTime = await DeleteQuestion(questionRepository).execute(id);
    response = h.response({ deleteTime });
    response.code(200);
    return response;
  } catch (error) {
    response = h.response({
      message: error.message,
    });

    if (error.message === 'Not Found') {
      response.code(404);
    } else {
      response.code(500);
    }

    return response;
  }
};

module.exports = {
  index,
  show,
  store,
  destroy,
  update,
};
