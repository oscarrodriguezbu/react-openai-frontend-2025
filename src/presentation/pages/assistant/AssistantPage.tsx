import { useEffect, useState } from 'react';
import { GptMessage, MyMessage, TypingLoader, TextMessageBox } from '../../components';
import { createThreadUseCase, postQuestionUseCase } from '../../../core/use-cases';

interface Message {
  text: string;
  isGpt: boolean;
}

export const AssistantPage = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const [threadId, setThreadId] = useState<string>();

  // Obtener el thread, y si no existe, crearlo
  useEffect(() => {
    const threadId = localStorage.getItem('threadId');
    if (threadId) {
      setThreadId(threadId);
    } else {
      createThreadUseCase()
        .then((id) => {
          setThreadId(id);
          localStorage.setItem('threadId', id)
        })
    }
  }, []);

  // useEffect(() => {
  //   if ( threadId ) {
  //     setMessages( (prev) => [ ...prev, { text: `Número de thread ${ threadId }`, isGpt: true }] )
  //   }
  // }, [threadId])


  const handlePost = async (text: string) => {

    if (!threadId) return;

    setIsLoading(true);
    setMessages((prev) => [...prev, { text: text, isGpt: false }]);

    const replies = await postQuestionUseCase(threadId, text)

    setIsLoading(false);

    //? En este ejercicio la respuesta manda todo el historial, 
    //? por lo que se puede mejorar el codigo para filtrar la data que llegue diferente 
    //? o algo asi para que no se dupliquen los mensajes
    for (const reply of replies) {
      for (const message of reply.content) {
        setMessages((prev) => [
          ...prev,
          { text: message, isGpt: (reply.role === 'assistant'), info: reply }
        ])
      }
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        <div className="grid grid-cols-12 gap-y-2">
          {/* Bienvenida */}
          <GptMessage text="Hola, soy Sam,¿Cuál es tu nombre? y ¿en qué puedo ayudarte?" />

          {
            messages.map((message, index) => (
              message.isGpt
                ? (
                  <GptMessage key={index} text={message.text} />
                )
                : (
                  <MyMessage key={index} text={message.text} />
                )

            ))
          }

          {
            isLoading && (
              <div className="col-start-1 col-end-12 fade-in">
                <TypingLoader />
              </div>
            )
          }


        </div>
      </div>


      <TextMessageBox
        onSendMessage={handlePost}
        placeholder='Escribe aquí lo que deseas'
        disableCorrections
      />

    </div>
  );
};
