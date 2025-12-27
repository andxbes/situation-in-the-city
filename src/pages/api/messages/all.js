import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getMessagesForPeriod } from "../../../tg/tclient";
import { getformatTimeFromUnixTimesStamp } from "../../../utils/utils";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You do not have permission to access this resource." });
    }

    if (req.method === 'GET') {
        try {
            const startTime = Date.now();
            const hours = parseInt(req.query.hours, 10) || 1;
            const fromTime = Math.floor(Date.now() / 1000) - (hours * 3600);

            // Получаем все сообщения
            const allMessages = await getMessagesForPeriod(fromTime);

            // Не применяем фильтрацию, отдаем все сообщения
            const processedMessages = allMessages.map(msg => {
                const replyToMsgId = msg.replyTo?.replyToMsgId;
                let replyTo = null;

                if (replyToMsgId) {
                    const replyMsg = allMessages.find(obj => obj.id === replyToMsgId);
                    if (replyMsg) {
                        replyTo = {
                            id: replyMsg.id,
                            message: replyMsg.message,
                            date: getformatTimeFromUnixTimesStamp(replyMsg.date),
                        };
                    }
                }

                return {
                    id: msg.id,
                    message: msg.message,
                    date: getformatTimeFromUnixTimesStamp(msg.date),
                    replyTo: replyTo,
                };
            });

            const endTime = Date.now();

            res.status(200).json({
                messages: processedMessages,
                meta: {
                    totalFound: allMessages.length,
                    processingTimeMs: endTime - startTime,
                }
            });
        } catch (error) {
            console.error('Error fetching all messages:', error);
            res.status(500).json({ message: "An error occurred while fetching messages." });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
